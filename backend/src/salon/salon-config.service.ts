import { insertOperationalEvent } from '../admin/operational-logs/operational-logs.service.js';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  OnModuleDestroy,
} from '@nestjs/common';
import { Pool } from 'pg';

export const DEFAULT_HOURS = Array.from({ length: 7 }, (_, day) => ({
  day,
  closed: false,
  start: '12:00',
  end: '21:00',
}));
export const defaultBookingDay = () => ({
  closed: false,
  open: 720,
  close: 1260,
  interval: 30,
});
export function validateSalonHours(value: any) {
  if (!Array.isArray(value) || value.length !== 7)
    throw new BadRequestException('Provide opening hours for all seven days.');
  return value.map((d: any, i: number) => {
    if (d?.day !== i || typeof d.closed !== 'boolean')
      throw new BadRequestException('Opening hours must run Monday to Sunday.');
    if (
      typeof d.start !== 'string' ||
      typeof d.end !== 'string' ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(d.start ?? '') ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(d.end ?? '') ||
      (!d.closed && d.start >= d.end)
    )
      throw new BadRequestException(
        'Each open day needs a closing time after its opening time.',
      );
    return { day: i, closed: d.closed, start: d.start, end: d.end };
  });
}
function field(value: unknown, label: string, max: number, required = false) {
  if (
    typeof value !== 'string' ||
    value.trim().length > max ||
    (required && !value.trim())
  )
    throw new BadRequestException(
      `${label} ${required ? 'is required and ' : ''}must be at most ${max} characters.`,
    );
  return value.trim();
}
export function validateSalonSection(section: string, values: any) {
  if (section === 'profile') {
    const profile = {
      salonName: field(values?.salonName, 'Salon name', 150, true),
      address: field(values?.address, 'Address', 500, true),
      phone: field(values?.phone, 'Phone', 40, true),
      email: field(values?.email ?? '', 'Email', 255),
      tin: field(values?.tin ?? '', 'TIN', 50),
      description: field(values?.description ?? '', 'Description', 600),
      receiptHeader: field(values?.receiptHeader ?? '', 'Receipt header', 300),
      receiptFooter: field(values?.receiptFooter ?? '', 'Receipt footer', 300),
    };
    if (!/^[+\d() .-]{7,40}$/.test(profile.phone))
      throw new BadRequestException('Enter a valid salon phone number.');
    if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email))
      throw new BadRequestException('Enter a valid business email.');
    return profile;
  }
  if (section === 'hours') {
    if (![15, 30, 60].includes(values?.slotInterval))
      throw new BadRequestException(
        'Choose a 15, 30 or 60 minute booking interval.',
      );
    return {
      days: validateSalonHours(values.days),
      slotInterval: values.slotInterval,
    };
  }
  if (section === 'inventory') {
    if (
      !Number.isInteger(values?.lowStockThreshold) ||
      values.lowStockThreshold < 0 ||
      values.lowStockThreshold > 1000000 ||
      typeof values.alertsEnabled !== 'boolean'
    )
      throw new BadRequestException(
        'Enter a valid stock threshold and alert preference.',
      );
    return {
      lowStockThreshold: values.lowStockThreshold,
      alertsEnabled: values.alertsEnabled,
    };
  }
  throw new BadRequestException('Unknown settings section.');
}
const COLUMNS = `id,salon_name,contact_email,contact_phone,address,timezone,currency,default_tax_rate,receipt_header,receipt_footer,tin_number,public_description,opening_hours,booking_slot_minutes,default_low_stock_threshold,inventory_alerts_enabled,updated_at::text AS revision`;
@Injectable()
export class SalonConfigService implements OnModuleDestroy {
  readonly pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 10000,
    query_timeout: 10000,
  });
  onModuleDestroy() {
    return this.pool.end();
  }
  format(r: any) {
    return {
      profile: {
        salonName: r.salon_name,
        address: r.address || '',
        phone: r.contact_phone || '',
        email: r.contact_email || '',
        tin: r.tin_number || '',
        description: r.public_description || '',
        receiptHeader: r.receipt_header || '',
        receiptFooter: r.receipt_footer || '',
      },
      hours: {
        days: r.opening_hours ?? DEFAULT_HOURS,
        slotInterval: r.booking_slot_minutes ?? 30,
      },
      inventory: {
        lowStockThreshold: r.default_low_stock_threshold ?? 5,
        alertsEnabled: r.inventory_alerts_enabled ?? true,
      },
      currency: r.currency,
      timezone: r.timezone,
      taxRate: Number(r.default_tax_rate),
      revision: r.revision,
    };
  }
  async get() {
    const r = (
      await this.pool.query(
        `SELECT ${COLUMNS} FROM public.system_settings WHERE id=1`,
      )
    ).rows[0];
    if (!r)
      throw new BadRequestException('Salon settings are not initialized.');
    return this.format(r);
  }
  async publicProfile() {
    const config = await this.get();
    return {
      salonName: config.profile.salonName,
      address: config.profile.address,
      phone: config.profile.phone,
      email: config.profile.email,
      description: config.profile.description,
      hours: config.hours.days,
      timezone: config.timezone,
    };
  }
  async bookingDay(date: string) {
    const config = await this.get();
    const index = (new Date(date + 'T00:00:00Z').getUTCDay() + 6) % 7;
    const d = config.hours.days[index];
    return {
      closed: d.closed,
      open: Number(d.start.slice(0, 2)) * 60 + Number(d.start.slice(3)),
      close: Number(d.end.slice(0, 2)) * 60 + Number(d.end.slice(3)),
      interval: config.hours.slotInterval,
    };
  }
  async save(actorId: number, section: string, body: any) {
    const values = validateSalonSection(section, body?.values);
    if (typeof body?.revision !== 'string')
      throw new BadRequestException('Reload settings before saving.');
    const c = await this.pool.connect();
    try {
      await c.query('BEGIN');
      const r = (
        await c.query(
          `SELECT ${COLUMNS} FROM public.system_settings WHERE id=1 FOR UPDATE`,
        )
      ).rows[0];
      const config = this.format(r);
      if (JSON.stringify((config as any)[section]) === JSON.stringify(values)) {
        await c.query('COMMIT');
        return config;
      }
      if (config.revision !== body.revision)
        throw new ConflictException(
          'Settings changed while you were editing. Refresh before saving.',
        );
      if (section === 'profile') {
        const p: any = values;
        await c.query(
          `UPDATE public.system_settings SET salon_name=$1,address=$2,contact_phone=$3,contact_email=$4,tin_number=$5,public_description=$6,receipt_header=$7,receipt_footer=$8,updated_by=$9,updated_at=clock_timestamp() WHERE id=1`,
          [
            p.salonName,
            p.address,
            p.phone,
            p.email,
            p.tin,
            p.description,
            p.receiptHeader,
            p.receiptFooter,
            actorId,
          ],
        );
      } else if (section === 'hours') {
        const v: any = values;
        const upcoming = (
          await c.query(
            `SELECT appointment_date,start_time::text,end_time::text FROM public.appointments WHERE archived_at IS NULL AND appointment_date >= to_char(now() AT TIME ZONE 'Asia/Manila','YYYY-MM-DD') AND (status IN ('PENDING','CONFIRMED') OR (status='AWAITING_DEPOSIT' AND reservation_expires_at>now()))`,
          )
        ).rows;
        if (
          upcoming.some((a) => {
            const d =
              v.days[
                (new Date(a.appointment_date + 'T00:00:00Z').getUTCDay() + 6) %
                  7
              ];
            return (
              !d ||
              d.closed ||
              a.start_time.slice(0, 5) < d.start ||
              a.end_time.slice(0, 5) > d.end
            );
          })
        )
          throw new ConflictException(
            'An existing upcoming appointment falls outside these hours. Keep its time available before saving.',
          );
        await c.query(
          'UPDATE public.system_settings SET opening_hours=$1::jsonb,booking_slot_minutes=$2,updated_by=$3,updated_at=clock_timestamp() WHERE id=1',
          [JSON.stringify(v.days), v.slotInterval, actorId],
        );
      } else {
        const v: any = values;
        await c.query(
          'UPDATE public.system_settings SET default_low_stock_threshold=$1,inventory_alerts_enabled=$2,updated_by=$3,updated_at=clock_timestamp() WHERE id=1',
          [v.lowStockThreshold, v.alertsEnabled, actorId],
        );
      }
      const actor = (
        await c.query(
          'SELECT "firstName","lastName",role FROM public."user" WHERE id=$1',
          [actorId],
        )
      ).rows[0];
      await insertOperationalEvent(
        {
          module: 'Settings & Configuration',
          event: 'Salon Settings Updated',
          actorUserId: actorId,
          userName: [actor.firstName, actor.lastName].filter(Boolean).join(' '),
          userRole: actor.role,
          details: 'Updated ' + section + ' settings.',
        },
        c,
      );
      const result = this.format(
        (
          await c.query(
            `SELECT ${COLUMNS} FROM public.system_settings WHERE id=1`,
          )
        ).rows[0],
      );
      await c.query('COMMIT');
      return result;
    } catch (e) {
      await c.query('ROLLBACK');
      throw e;
    } finally {
      c.release();
    }
  }
}
