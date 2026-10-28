import 'dotenv/config';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import pg from 'pg';
import type { PoolClient } from 'pg';

// A separate PG transaction is used so stylist availability and the appointment
// insertion are protected by the SAME advisory lock. This avoids racing checkouts.
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
const PH_TZ = 'Asia/Manila';
const HOLD_MINUTES = 15;
type BookingInput = {
  serviceId: number;
  stylistId: string;
  appointmentDate: string;
  startTime: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
};
type DbAppointment = {
  id: number; reference_code: string; customer_name: string; customer_email: string;
  appointment_date: string; start_time: string; end_time: string;
  service_id: number; staff_id: string | null; status: string;
  payment_status: string; total_amount: string | null;
  deposit_amount: string | null; payment_reference: string | null;
  booking_token_hash: string | null; reservation_expires_at: Date | null;
};

function salonNow() {
  const values = new Intl.DateTimeFormat('en-CA', {
    timeZone: PH_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const value = (type: string) => values.find((v) => v.type === type)?.value ?? '';
  return { date: `${value('year')}-${value('month')}-${value('day')}`, minutes: Number(value('hour')) * 60 + Number(value('minute')) };
}
const minutes = (time: string) => {
  const match = /^(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(String(time));
  if (!match) throw new BadRequestException('Invalid appointment time');
  return Number(match[1]) * 60 + Number(match[2]);
};
const hhmm = (value: number) => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
const hash = (token: string) => createHash('sha256').update(token).digest('hex');
const HOLD_SQL = `a.status IN ('PENDING', 'CONFIRMED') OR (a.status = 'AWAITING_DEPOSIT' AND a.reservation_expires_at > NOW())`;

@Injectable()
export class GuestBookingService {
  private checkDate(date: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`)) || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date || date < salonNow().date) {
      throw new BadRequestException('Choose a valid current or future appointment date');
    }
  }
  private checkStart(date: string, startTime: string) {
    this.checkDate(date);
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)) throw new BadRequestException('startTime must be HH:mm');
    const start = minutes(startTime);
    const now = salonNow();
    if (start < 720 || start >= 1260 || start % 30 || (date === now.date && start <= now.minutes)) {
      throw new BadRequestException('Choose a future slot within salon hours (12:00–21:00)');
    }
    return start;
  }
  async stylists() {
    const result = await pool.query(`SELECT st.id, u."firstName", u."lastName"
      FROM public.staff st JOIN public."user" u ON u.id = st.user_id
      WHERE st.is_active = TRUE AND st.archived_at IS NULL
        AND u.role = 'STAFF' AND u."isActive" = TRUE AND u.archived_at IS NULL
      ORDER BY u."firstName", u."lastName"`);
    return result.rows.map((row: {id: string; firstName: string; lastName: string}) => ({ id: row.id, name: `${row.firstName} ${row.lastName}`.trim() }));
  }
  private async service(client: PoolClient, serviceId: number) {
    if (!Number.isSafeInteger(serviceId) || serviceId < 1) throw new BadRequestException('Invalid service');
    const result = await client.query(`SELECT id, name, price::text AS price, duration_minutes AS duration
      FROM public.services WHERE id = $1 AND is_active = TRUE AND archived_at IS NULL`, [serviceId]);
    const service = result.rows[0] as { id: number; name: string; price: string; duration: number } | undefined;
    if (!service) throw new NotFoundException('Service is unavailable');
    return service;
  }
  private async stylist(client: PoolClient, stylistId: string) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(stylistId)) {
      throw new BadRequestException('Choose a valid specialist');
    }
    const result = await client.query(`SELECT st.id, u."firstName", u."lastName"
      FROM public.staff st JOIN public."user" u ON u.id = st.user_id
      WHERE st.id = $1::uuid AND st.is_active = TRUE AND st.archived_at IS NULL
        AND u.role = 'STAFF' AND u."isActive" = TRUE AND u.archived_at IS NULL`, [stylistId]);
    if (!result.rowCount) throw new BadRequestException('Selected specialist is unavailable');
    return result.rows[0] as { id: string; firstName: string; lastName: string };
  }
  private async existing(client: PoolClient, date: string) {
    const result = await client.query(`SELECT a.start_time::text AS start_time, a.end_time::text AS end_time, a.staff_id
      FROM public.appointments a WHERE a.appointment_date = $1 AND (${HOLD_SQL})`, [date]);
    return result.rows as { start_time: string; end_time: string; staff_id: string | null }[];
  }
  private overlapping(rows: Awaited<ReturnType<GuestBookingService['existing']>>, stylistId: string, start: number, end: number) {
    return rows.some((a) => (a.staff_id === null || a.staff_id.toLowerCase() === stylistId.toLowerCase())
      && start < minutes(a.end_time) && end > minutes(a.start_time));
  }
  async availableSlots(date: string, serviceId: number, stylistId: string) {
    this.checkDate(date);
    const client = await pool.connect();
    try {
      const service = await this.service(client, serviceId);
      await this.stylist(client, stylistId);
      const rows = await this.existing(client, date);
      const duration = Number(service.duration);
      if (!Number.isSafeInteger(duration) || duration <= 0) throw new InternalServerErrorException('Invalid service duration');
      const now = salonNow();
      const slots = [];
      for (let start = 720; start + duration <= 1260; start += 30) {
        const end = start + duration;
        slots.push({ startTime: hhmm(start), endTime: hhmm(end), available: !(date === now.date && start <= now.minutes) && !this.overlapping(rows, stylistId, start, end) });
      }
      return { date, serviceId, stylistId, serviceDurationMinutes: duration, slots };
    } finally { client.release(); }
  }
  private async lockDate(client: PoolClient, date: string) {
    // Match the same lock for every guest checkout on this date.
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`centyzz-guest-booking:${date}`]);
  }
  async createCheckout(input: BookingInput) {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Demo checkout is disabled in production');
    }
    const { serviceId, stylistId, appointmentDate, startTime } = input;
    const start = this.checkStart(appointmentDate, startTime);
    const name = String(input.customerName ?? '').trim();
    const email = String(input.customerEmail ?? '').trim().toLowerCase();
    const phone = String(input.customerPhone ?? '').trim();
    if (!name || name.length > 150) throw new BadRequestException('Customer name must be 1–150 characters');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) throw new BadRequestException('Enter a valid email');
    if (!/^[+\d() .-]{7,30}$/.test(phone)) throw new BadRequestException('Enter a valid phone number');
    const client = await pool.connect();
    const token = randomBytes(24).toString('hex');
    let booking: { id: number; referenceCode: string; depositAmount: number; totalAmount: number; serviceName: string; stylistName: string } | undefined;
    try {
      await client.query('BEGIN');
      await this.lockDate(client, appointmentDate);
      const service = await this.service(client, serviceId);
      const stylist = await this.stylist(client, stylistId);
      const duration = Number(service.duration);
      const end = start + duration;
      if (!Number.isSafeInteger(duration) || duration <= 0 || end > 1260) throw new BadRequestException('Service does not fit this slot');
      if (this.overlapping(await this.existing(client, appointmentDate), stylistId, start, end)) {
        throw new ConflictException('That time was just reserved. Choose another available time.');
      }
      const price = Number(service.price);
      if (!Number.isFinite(price) || price <= 0) throw new BadRequestException('Service price is invalid');
      // No price or amount is accepted from the browser.
      const cents = Math.round(price * 100);
      const depositCents = Math.round(cents / 2);
      const referenceCode = `CNTZ-${appointmentDate.replaceAll('-', '')}-${randomBytes(4).toString('hex').toUpperCase()}`;
      const insert = await client.query(`INSERT INTO public.appointments
        (reference_code, service_id, customer_name, customer_email, appointment_date, start_time, end_time, status,
         staff_id, guest_phone, total_amount, deposit_amount, payment_status, payment_provider, reservation_expires_at, booking_token_hash)
        VALUES ($1,$2,$3,$4,$5,$6,$7,'AWAITING_DEPOSIT',$8,$9,$10,$11,'UNPAID','DEMO',NOW() + INTERVAL '15 minutes',$12)
        RETURNING id`, [referenceCode, serviceId, name, email, appointmentDate, startTime, hhmm(end), stylistId, phone,
          (cents / 100).toFixed(2), (depositCents / 100).toFixed(2), hash(token)]);
      booking = { id: insert.rows[0].id, referenceCode, depositAmount: depositCents / 100,
        totalAmount: cents / 100, serviceName: service.name, stylistName: `${stylist.firstName} ${stylist.lastName}`.trim() };
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally { client.release(); }

    if (!booking) throw new InternalServerErrorException('Booking could not be created');
    // Development-only prototype: no payment gateway and no real money movement.
    return { ...booking, token, mode: 'DEMO', holdMinutes: HOLD_MINUTES };
  }
  async completeDemo(id: number, token: string) {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Demo checkout is unavailable');
    }
    if (!Number.isSafeInteger(id) || id < 1 || !/^[0-9a-f]{48}$/.test(token)) {
      throw new BadRequestException('Invalid demo booking');
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const selected = await client.query(`SELECT id, reference_code, appointment_date, start_time::text, end_time::text,
        staff_id, reservation_expires_at FROM public.appointments
        WHERE id=$1 AND booking_token_hash=$2 AND status='AWAITING_DEPOSIT'`, [id, hash(token)]);
      if (!selected.rowCount) throw new ConflictException('Demo checkout has already finished or is invalid');
      const b = selected.rows[0] as { appointment_date: string; start_time: string; end_time: string; staff_id: string; reservation_expires_at: Date; reference_code: string };
      await this.lockDate(client, b.appointment_date);
      if (new Date(b.reservation_expires_at) <= new Date()) throw new ConflictException('Demo hold expired; please book again');
      const others = (await client.query(`SELECT a.start_time::text, a.end_time::text, a.staff_id
        FROM public.appointments a WHERE a.id <> $1 AND a.appointment_date=$2 AND (${HOLD_SQL})`,
        [id, b.appointment_date])).rows;
      if (this.overlapping(others, b.staff_id, minutes(b.start_time), minutes(b.end_time))) {
        throw new ConflictException('This time is no longer available');
      }
      const updated = await client.query(`UPDATE public.appointments SET payment_status='DEMO_PAID',
        status='PENDING', reservation_expires_at=NULL WHERE id=$1 AND booking_token_hash=$2
        AND status='AWAITING_DEPOSIT' AND reservation_expires_at > NOW()
        RETURNING reference_code`, [id, hash(token)]);
      if (!updated.rowCount) throw new ConflictException('Demo checkout expired');
      await client.query('COMMIT');
      return { success: true, referenceCode: updated.rows[0].reference_code, status: 'PENDING', paymentStatus: 'DEMO_PAID',
        warning: 'Prototype payment only; no money was charged' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  }
  async status(reference: string, token: string) {
    if (!reference || !token) throw new BadRequestException('Booking reference and token required');
    const found = await pool.query(`SELECT reference_code, status, payment_status, deposit_amount, reservation_expires_at
      FROM public.appointments WHERE reference_code=$1 AND booking_token_hash=$2`, [reference, hash(token)]);
    if (!found.rowCount) throw new NotFoundException('Booking not found');
    const b = found.rows[0];
    return { referenceCode: b.reference_code, status: b.status, paymentStatus: b.payment_status,
      depositAmount: Number(b.deposit_amount), holdExpired: b.status === 'AWAITING_DEPOSIT' && new Date(b.reservation_expires_at) <= new Date() };
  }
  async getGuestCalendarAppointmentId(reference: string, token: string): Promise<number> {
    if (!reference || !/^[0-9a-f]{48}$/.test(token || '')) throw new BadRequestException('Booking reference and token required');
    const found = await pool.query(`SELECT id FROM public.appointments
      WHERE reference_code=$1 AND booking_token_hash=$2
        AND status IN ('PENDING','CONFIRMED') AND payment_status IN ('PAID','TEST_PAID','DEMO_PAID')`,
      [reference, hash(token)]);
    if (!found.rowCount) throw new NotFoundException('A paid, scheduled booking is required to add to calendar');
    return Number(found.rows[0].id);
  }

  async listForStaff(id: number, role: string) {
    const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(String(role).toUpperCase());
    if (!isAdmin && String(role).toUpperCase() !== 'STAFF') throw new ForbiddenException('Staff access required');
    const result = await pool.query(`SELECT a.*, s.name AS service_name, s.price AS service_price, s.duration_minutes,
      u."firstName" AS stylist_first, u."lastName" AS stylist_last
      FROM public.appointments a JOIN public.services s ON s.id=a.service_id
      LEFT JOIN public.staff st ON st.id = a.staff_id
      LEFT JOIN public."user" u ON u.id = st.user_id
      WHERE ($1::boolean = TRUE OR EXISTS (
        SELECT 1 FROM public.staff mine WHERE mine.id = a.staff_id AND mine.user_id = $2
          AND mine.is_active = TRUE AND mine.archived_at IS NULL
      ))
        AND a.status NOT IN ('AWAITING_DEPOSIT','PAYMENT_REVIEW','CANCELLED')
      ORDER BY a.appointment_date DESC, a.start_time DESC LIMIT 250`, [isAdmin, id]);
    return { success: true, data: result.rows.map((a) => ({
      id: a.id, referenceCode: a.reference_code, userId: a.user_id, serviceId: a.service_id,
      customerName: a.customer_name, customerEmail: a.customer_email, appointmentDate: a.appointment_date,
      startTime: String(a.start_time), endTime: String(a.end_time), status: a.status, notes: a.notes,
      stylistId: a.staff_id, stylistName: [a.stylist_first, a.stylist_last].filter(Boolean).join(' ') || 'Unassigned',
      paymentStatus: a.payment_status, depositAmount: a.deposit_amount ? Number(a.deposit_amount) : null,
      totalAmount: a.total_amount ? Number(a.total_amount) : null,
      service: { id: a.service_id, name: a.service_name, price: Number(a.service_price), durationMinutes: a.duration_minutes },
    })) };
  }
  async updateForStaff(id: number, status: string, userId: number, role: string) {
    const normalized = String(status).toUpperCase();
    if (!['CONFIRMED', 'NO_SHOW'].includes(normalized)) throw new BadRequestException('Invalid staff status');
    const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(String(role).toUpperCase());
    if (!isAdmin && String(role).toUpperCase() !== 'STAFF') throw new ForbiddenException('Staff access required');
    const found = await pool.query(`UPDATE public.appointments SET status=$2
      WHERE id=$1 AND ($3::boolean=TRUE OR EXISTS (
        SELECT 1 FROM public.staff mine WHERE mine.id = appointments.staff_id AND mine.user_id = $4
          AND mine.is_active = TRUE AND mine.archived_at IS NULL
      ))
      AND status IN ('PENDING','CONFIRMED') RETURNING id, status`, [id, normalized, isAdmin, userId]);
    if (!found.rowCount) throw new NotFoundException('Appointment not found or not assigned to you');
    return { success: true, data: found.rows[0] };
  }
}
