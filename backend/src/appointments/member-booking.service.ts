import {
  BadRequestException,
  ConflictException,
  Injectable,
  OnModuleDestroy,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { Pool, type PoolClient } from 'pg';
import { SalonConfigService } from '../salon/salon-config.service.js';
import { insertOperationalEvent } from '../admin/operational-logs/operational-logs.service.js';

export function memberServiceIds(value: unknown): number[] {
  if (
    !Array.isArray(value) ||
    value.length < 1 ||
    value.length > 20 ||
    value.some((id) => !Number.isSafeInteger(id) || id < 1) ||
    new Set(value).size !== value.length
  )
    throw new BadRequestException('Choose 1–20 distinct services.');
  return value as number[];
}
const timeMinutes = (time: string) => {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))
    throw new BadRequestException('Choose a valid appointment time.');
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};
const hhmm = (minutes: number) =>
  String(Math.floor(minutes / 60)).padStart(2, '0') +
  ':' +
  String(minutes % 60).padStart(2, '0');
const occupied = `archived_at IS NULL AND (status IN ('PENDING','CONFIRMED') OR (status='AWAITING_DEPOSIT' AND reservation_expires_at>now()))`;

@Injectable()
export class MemberBookingService implements OnModuleDestroy {
  readonly pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 4,
    connectionTimeoutMillis: 10000,
  });
  constructor(private readonly salon: SalonConfigService) {}
  onModuleDestroy() {
    return this.pool.end();
  }
  private now() {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date());
    const p = (key: string) => parts.find((x) => x.type === key)?.value || '';
    return {
      date: `${p('year')}-${p('month')}-${p('day')}`,
      minutes: Number(p('hour')) * 60 + Number(p('minute')),
    };
  }
  private date(value: string) {
    if (
      typeof value !== 'string' ||
      !/^20\d{2}-\d{2}-\d{2}$/.test(value) ||
      !Number.isFinite(Date.parse(value + 'T00:00:00Z')) ||
      new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) !== value ||
      value < this.now().date
    )
      throw new BadRequestException('Choose a valid current or future date.');
    return value;
  }
  private async catalog(
    c: Pick<PoolClient, 'query'>,
    ids: number[],
    lock = false,
  ) {
    const rows = (
      await c.query(
        `SELECT id,name,price::text,duration_minutes FROM public.services WHERE id=ANY($1::int[]) AND is_active AND archived_at IS NULL ${lock ? 'FOR SHARE' : ''}`,
        [ids],
      )
    ).rows;
    if (rows.length !== ids.length)
      throw new BadRequestException('A selected service is unavailable.');
    return ids.map((id) => {
      const row = rows.find((r) => r.id === id);
      if (
        !Number.isInteger(row.duration_minutes) ||
        row.duration_minutes < 1 ||
        !Number.isFinite(Number(row.price)) ||
        Number(row.price) < 0
      )
        throw new BadRequestException(
          'A service has an invalid price or duration.',
        );
      return row;
    });
  }
  async availability(date: string, ids: number[]) {
    this.date(date);
    memberServiceIds(ids);
    const services = await this.catalog(this.pool, ids);
    const duration = services.reduce((n, s) => n + s.duration_minutes, 0),
      day = await this.salon.bookingDay(date),
      now = this.now();
    const booked = (
      await this.pool.query(
        `SELECT start_time::text,end_time::text FROM public.appointments WHERE appointment_date=$1 AND ${occupied}`,
        [date],
      )
    ).rows;
    const slots = [] as {
      startTime: string;
      endTime: string;
      available: boolean;
    }[];
    if (!day.closed)
      for (
        let start = day.open;
        start + duration <= day.close;
        start += day.interval
      ) {
        const end = start + duration;
        slots.push({
          startTime: hhmm(start),
          endTime: hhmm(end),
          available:
            !(date === now.date && start <= now.minutes) &&
            !booked.some(
              (r) =>
                start < timeMinutes(r.end_time.slice(0, 5)) &&
                end > timeMinutes(r.start_time.slice(0, 5)),
            ),
        });
      }
    return { date, serviceIds: ids, serviceDurationMinutes: duration, slots };
  }
  async summaries(ids: number[]) {
    if (!ids.length) return new Map<number, any>();
    const rows = (
      await this.pool.query(
        'SELECT * FROM public.appointment_service_summary WHERE appointment_id=ANY($1::int[])',
        [ids],
      )
    ).rows;
    return new Map(
      rows.map((r) => [
        r.appointment_id,
        {
          services: r.services,
          service: {
            id: r.services[0].id,
            name: r.names,
            price: Number(r.price),
            durationMinutes: r.duration_minutes,
          },
        },
      ]),
    );
  }
  async create(input: any, userId: number, email: string) {
    const ids = memberServiceIds(input.serviceIds ?? [input.serviceId]);
    if (input.serviceIds && input.serviceId !== undefined)
      throw new BadRequestException('Send serviceIds or serviceId, not both.');
    const date = this.date(input.appointmentDate),
      start = timeMinutes(input.startTime);
    const key = input.idempotencyKey ?? null;
    if (
      key !== null &&
      (typeof key !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          key,
        ))
    )
      throw new BadRequestException('Invalid booking reference.');
    const hash = createHash('sha256')
      .update(JSON.stringify([ids, date, input.startTime]))
      .digest('hex');
    const c = await this.pool.connect();
    try {
      await c.query('BEGIN');
      const user = (
        await c.query(
          `SELECT id,"firstName","lastName",email FROM public."user" WHERE id=$1 AND lower(email)=lower($2) AND role='CUSTOMER' AND "isActive" AND "emailVerified" AND archived_at IS NULL AND NOT coalesce("isArchived",false) FOR SHARE`,
          [userId, email],
        )
      ).rows[0];
      if (!user)
        throw new UnauthorizedException(
          'An active verified Client account is required.',
        );
      if (key) {
        await c.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
          `centyzz-member-request:${userId}:${key}`,
        ]);
        const previous = (
          await c.query(
            'SELECT id,booking_request_hash FROM public.appointments WHERE user_id=$1 AND booking_request_key=$2',
            [userId, key],
          )
        ).rows[0];
        if (previous) {
          if (previous.booking_request_hash !== hash)
            throw new ConflictException(
              'This booking reference was already used.',
            );
          await c.query('COMMIT');
          return { success: true, unchanged: true, data: { id: previous.id } };
        }
      }
      await c.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        'centyzz-guest-booking:' + date,
      ]);
      const services = await this.catalog(c, ids, true),
        duration = services.reduce((n, s) => n + s.duration_minutes, 0),
        day = await this.salon.bookingDay(date),
        end = start + duration,
        now = this.now();
      if (
        day.closed ||
        start < day.open ||
        end > day.close ||
        (start - day.open) % day.interval !== 0 ||
        (date === now.date && start <= now.minutes)
      )
        throw new BadRequestException(
          'All selected services must fit in a future slot within salon operating hours.',
        );
      const conflict = await c.query(
        `SELECT id FROM public.appointments WHERE appointment_date=$1 AND ${occupied} AND start_time<$3::time AND end_time>$2::time LIMIT 1`,
        [date, input.startTime, hhmm(end)],
      );
      if (conflict.rowCount)
        throw new ConflictException(
          'That appointment time is no longer available. Choose another time.',
        );
      const price =
        services.reduce((n, s) => n + Math.round(Number(s.price) * 100), 0) /
        100;
      const reference = `CNTZ-${date.replaceAll('-', '')}-${randomBytes(4).toString('hex').toUpperCase()}`;
      const created = (
        await c.query(
          `INSERT INTO public.appointments(reference_code,user_id,service_id,customer_name,customer_email,appointment_date,start_time,end_time,status,total_amount,booking_request_key,booking_request_hash) VALUES($1,$2,$3,$4,$5,$6,$7::time,$8::time,'PENDING',$9,$10,$11) RETURNING id,reference_code AS "referenceCode",appointment_date AS "appointmentDate",start_time::text AS "startTime",end_time::text AS "endTime",status`,
          [
            reference,
            userId,
            ids[0],
            [user.firstName, user.lastName].join(' ').trim(),
            user.email,
            date,
            input.startTime,
            hhmm(end),
            price.toFixed(2),
            key,
            hash,
          ],
        )
      ).rows[0];
      for (let i = 0; i < services.length; i++) {
        const s = services[i];
        await c.query(
          'INSERT INTO public.appointment_services(appointment_id,service_id,position,service_name,unit_price,duration_minutes) VALUES($1,$2,$3,$4,$5,$6)',
          [created.id, s.id, i, s.name, s.price, s.duration_minutes],
        );
      }
      await insertOperationalEvent(
        {
          module: 'Schedule',
          event: 'Appointment Created',
          actorUserId: userId,
          userName: [user.firstName, user.lastName].join(' ').trim(),
          userRole: 'CUSTOMER',
          details: `Appointment ${reference}; ${services.length} service(s); ${duration} minutes.`,
          status: 'Logged',
        },
        c,
      );
      await c.query('COMMIT');
      return {
        success: true,
        data: {
          ...created,
          services: services.map((s) => ({
            id: s.id,
            name: s.name,
            price: Number(s.price),
            durationMinutes: s.duration_minutes,
          })),
          service: {
            id: ids[0],
            name: services.map((s) => s.name).join(', '),
            price,
            durationMinutes: duration,
          },
        },
      };
    } catch (error) {
      await c.query('ROLLBACK');
      throw error;
    } finally {
      c.release();
    }
  }
}
