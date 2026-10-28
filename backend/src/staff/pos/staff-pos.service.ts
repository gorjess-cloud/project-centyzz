import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
} from '@nestjs/common';
import { Pool } from 'pg';
import { createHash, randomUUID } from 'node:crypto';
import { amount, cents, reportToday } from '../../admin/reports/report-math.js';
import { insertOperationalEvent } from '../../admin/operational-logs/operational-logs.service.js';
const uuid = (v: unknown) =>
  typeof v === 'string' &&
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);
export function checkoutInput(body: any) {
  if (
    !uuid(body?.idempotencyKey) ||
    !Array.isArray(body.items) ||
    !body.items.length ||
    body.items.length > 100 ||
    !Array.isArray(body.payments) ||
    !body.payments.length ||
    body.payments.length > 5
  )
    throw new BadRequestException(
      'Supply a checkout reference, services and payments.',
    );
  const combined = new Map<number, number>();
  for (const i of body.items) {
    if (
      !Number.isSafeInteger(i?.serviceId) ||
      i.serviceId < 1 ||
      !Number.isSafeInteger(i.quantity) ||
      i.quantity < 1 ||
      i.quantity > 100
    )
      throw new BadRequestException('Choose valid services and quantities.');
    combined.set(i.serviceId, (combined.get(i.serviceId) || 0) + i.quantity);
    if (combined.get(i.serviceId)! > 100)
      throw new BadRequestException('Service quantity is too large.');
  }
  const items = [...combined]
      .sort(([a], [b]) => a - b)
      .map(([serviceId, quantity]) => ({ serviceId, quantity })),
    discount = cents(body.discount ?? 0),
    expected = cents(body.expectedTotal);
  if (discount < 0 || expected <= 0)
    throw new BadRequestException('Enter a valid discount and positive total.');
  const payments = body.payments.map((p: any) => {
    const method =
      String(p?.method || '')
        .trim()
        .toUpperCase() === 'QR PH'
        ? 'QRPH'
        : String(p?.method || '')
            .trim()
            .toUpperCase();
    if (
      !['CASH', 'QRPH', 'GCASH', 'MAYA', 'CARD', 'BANK_TRANSFER'].includes(
        method,
      )
    )
      throw new BadRequestException('Select a supported payment method.');
    const paid = cents(p.amount);
    if (paid <= 0) throw new BadRequestException('Payments must be positive.');
    if (method === 'CASH') {
      const tendered = cents(p.tendered);
      if (tendered < paid)
        throw new BadRequestException('Cash received is below the amount due.');
      return { method, paid, tendered, reference: null };
    }
    if (
      p.verified !== true ||
      typeof p.reference !== 'string' ||
      !p.reference.trim() ||
      p.reference.trim().length > 100
    )
      throw new BadRequestException(
        'Confirm the external payment and enter its receipt reference.',
      );
    return { method, paid, tendered: null, reference: p.reference.trim() };
  });
  if (payments.reduce((sum: number, p: any) => sum + p.paid, 0) !== expected)
    throw new BadRequestException(
      'Payments must exactly cover the amount due.',
    );
  const references = payments
    .filter((p: any) => p.reference)
    .map((p: any) => p.reference);
  if (new Set(references).size !== references.length)
    throw new BadRequestException(
      'Each external payment needs a distinct receipt reference.',
    );
  const fingerprint = createHash('sha256')
    .update(JSON.stringify({ items, discount, expected, payments }))
    .digest('hex');
  return {
    key: body.idempotencyKey,
    items,
    discount,
    expected,
    payments,
    fingerprint,
  };
}
export type StaffTransactionDetails={
 id:string;txnId:string;date:string;time:string;cashier:string;status:string;total:number;legacy:boolean;
 subtotal?:number;discount?:number;tax?:number;currency?:string;summary?:string;paymentMethod?:string;note?:string;
 items:{id:string;name:string;quantity:number;unitPrice:number;discount:number;tax:number;total:number}[];
 payments:{id:string;method:string;status:string;amount:number;cashReceived:number|null;change:number|null}[];
};
@Injectable()
export class StaffPosService implements OnModuleDestroy {
  readonly pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 4,
    connectionTimeoutMillis: 10000,
    query_timeout: 15000,
  });
  onModuleDestroy() {
    return this.pool.end();
  }
  async transactionDetails(actorId:number,key:string):Promise<StaffTransactionDetails> {
    const match = /^(transaction|legacy):([1-9]\d{0,18})$/.exec(key);
    if (!match || BigInt(match[2]) > 9223372036854775807n)
      throw new BadRequestException('Invalid transaction reference.');
    if (match[1] === 'legacy') {
      if (BigInt(match[2]) > 2147483647n)
        throw new BadRequestException('Invalid transaction reference.');
      const row = (
        await this.pool.query(
          `SELECT p.id,p.txn_id,p.transaction_id,p.service,p.method,p.status,p.amount::text,
        public.admin_report_day(p.report_date)::text AS date,p.txn_time AS time,
        concat_ws(' ',u."firstName",u."lastName") AS cashier
        FROM public.pos_transactions p JOIN public.staff s ON s.id=p.cashier_staff_id
        JOIN public."user" u ON u.id=s.user_id WHERE p.id=$1 AND s.user_id=$2`,
          [match[2], actorId],
        )
      ).rows[0];
      if (!row) throw new NotFoundException('Transaction not found.');
      if (row.transaction_id)
        return this.transactionDetails(
          actorId,
          'transaction:' + row.transaction_id,
        );
      return {
        id: key,
        txnId: row.txn_id,
        date: row.date,
        time: row.time,
        cashier: row.cashier,
        status: row.status,
        total: Number(row.amount),
        summary: row.service,
        paymentMethod: row.method,
        legacy: true,
        items: [],
        payments: [],
        note: 'Historical record: individual item quantities, cash tendered and payment breakdown were not stored.',
      };
    }
    const c = await this.pool.connect();
    try {
      await c.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const row = (
        await c.query(
          `SELECT t.id::text,t.status,t.subtotal::text,t.discount_total::text,t.tax_total::text,t.grand_total::text,
        to_char(coalesce(t.completed_at,t.created_at) AT TIME ZONE 'Asia/Manila','YYYY-MM-DD') AS date,
        to_char(coalesce(t.completed_at,t.created_at) AT TIME ZONE 'Asia/Manila','HH24:MI:SS') AS time,
        concat_ws(' ',u."firstName",u."lastName") AS cashier,t.currency
        FROM public.transactions t JOIN public.staff s ON s.id=t.cashier_staff_id
        JOIN public."user" u ON u.id=s.user_id WHERE t.id=$1::bigint AND s.user_id=$2 AND t.cashier_id=$2`,
          [match[2], actorId],
        )
      ).rows[0];
      if (!row) throw new NotFoundException('Transaction not found.');
      const lines = (
        await c.query(
          `SELECT id::text,item_name,quantity,unit_price::text,discount_amount::text,tax_amount::text,line_total::text
        FROM public.transaction_items WHERE transaction_id=$1::bigint AND removed_at IS NULL ORDER BY id`,
          [row.id],
        )
      ).rows;
      const payments = (
        await c.query(
          `SELECT id::text,method,status,amount::text,cash_received::text,change_amount::text
        FROM public.payments WHERE transaction_id=$1::bigint ORDER BY id`,
          [row.id],
        )
      ).rows;
      await c.query('COMMIT');
      return {
        id: 'transaction:' + row.id,
        txnId: 'TXN-' + row.id,
        date: row.date,
        time: row.time,
        cashier: row.cashier,
        status: row.status,
        currency: row.currency,
        subtotal: Number(row.subtotal),
        discount: Number(row.discount_total),
        tax: Number(row.tax_total),
        total: Number(row.grand_total),
        legacy: false,
        items: lines.map((i) => ({
          id: i.id,
          name: i.item_name,
          quantity: i.quantity,
          unitPrice: Number(i.unit_price),
          discount: Number(i.discount_amount),
          tax: Number(i.tax_amount),
          total: Number(i.line_total),
        })),
        payments: payments.map((p) => ({
          id: p.id,
          method: p.method,
          status: p.status,
          amount: Number(p.amount),
          cashReceived:
            p.cash_received === null ? null : Number(p.cash_received),
          change: p.change_amount === null ? null : Number(p.change_amount),
        })),
      };
    } catch (error) {
      await c.query('ROLLBACK');
      throw error;
    } finally {
      c.release();
    }
  }
  async checkout(actorId: number, body: any) {
    const input = checkoutInput(body),
      c = await this.pool.connect();
    try {
      await c.query('BEGIN');
      await c.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        'staff-checkout:' + input.key,
      ]);
      const existing = (
        await c.query(
          'SELECT id::text,cashier_id,checkout_request_hash,grand_total::text FROM public.transactions WHERE idempotency_key=$1::uuid',
          [input.key],
        )
      ).rows[0];
      if (existing) {
        if (
          existing.cashier_id !== actorId ||
          existing.checkout_request_hash !== input.fingerprint
        )
          throw new ConflictException(
            'This checkout reference is already in use.',
          );
        await c.query('COMMIT');
        return {
          success: true,
          id: existing.id,
          total: Number(existing.grand_total),
          unchanged: true,
        };
      }
      const actor = (
        await c.query(
          `SELECT s.id AS staff_id,u.role,concat_ws(' ',u."firstName",u."lastName") AS name FROM public.staff s JOIN public."user" u ON u.id=s.user_id WHERE s.user_id=$1 AND u.role='STAFF' AND u."isActive" AND u.archived_at IS NULL AND s.is_active AND s.archived_at IS NULL FOR SHARE OF u,s`,
          [actorId],
        )
      ).rows[0];
      if (!actor)
        throw new ForbiddenException(
          'An active linked Staff account is required.',
        );
      const day = reportToday();
      await c.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        'centyzz-closeout:' + day,
      ]);
      if (
        (
          await c.query(
            'SELECT 1 FROM public.closeout_reports WHERE public.admin_report_day(report_date)=$1::date AND is_closed AND archived_at IS NULL AND (cashier_staff_id=$2::uuid OR cashier_staff_id IS NULL) LIMIT 1',
            [day, actor.staff_id],
          )
        ).rowCount
      )
        throw new ConflictException(
          'The register is closed for today. No new checkout was saved.',
        );
      const services = (
        await c.query(
          'SELECT id,name,price::text FROM public.services WHERE id=ANY($1::int[]) AND is_active AND archived_at IS NULL ORDER BY id FOR SHARE',
          [input.items.map((i) => i.serviceId)],
        )
      ).rows;
      if (services.length !== input.items.length)
        throw new BadRequestException('A selected service is unavailable.');
      const lines = input.items.map((item) => {
        const service = services.find((s) => s.id === item.serviceId);
        return { ...item, name: service.name, unit: cents(service.price) };
      });
      const subtotal = lines.reduce((sum, l) => sum + l.unit * l.quantity, 0);
      if (
        input.discount >= subtotal ||
        subtotal - input.discount !== input.expected
      )
        throw new ConflictException(
          'Service prices or quantities changed. Review the cart before confirming payment.',
        );
      const transaction = (
        await c.query(
          `INSERT INTO public.transactions(idempotency_key,cashier_id,cashier_staff_id,checkout_request_hash,status,subtotal,discount_total,tax_total) VALUES($1,$2,$3,$4,'DRAFT',$5,$6,0) RETURNING id::text`,
          [
            input.key,
            actorId,
            actor.staff_id,
            input.fingerprint,
            amount(subtotal),
            amount(input.discount),
          ],
        )
      ).rows[0];
      for (const line of lines)
        await c.query(
          'INSERT INTO public.transaction_items(transaction_id,service_id,item_name,quantity,unit_price,unit_cost,discount_amount,tax_rate,tax_amount) VALUES($1,$2,$3,$4,$5,0,0,0,0)',
          [
            transaction.id,
            line.serviceId,
            line.name,
            line.quantity,
            amount(line.unit),
          ],
        );
      for (const payment of input.payments)
        await c.query(
          `INSERT INTO public.payments(transaction_id,idempotency_key,method,status,amount,cash_received,provider,provider_reference,received_by,paid_at) VALUES($1,$2,$3,'SUCCEEDED',$4,$5,$6,$7,$8,now())`,
          [
            transaction.id,
            randomUUID(),
            payment.method,
            amount(payment.paid),
            payment.tendered === null ? null : amount(payment.tendered),
            payment.reference ? 'STAFF_CONFIRMED' : null,
            payment.reference,
            actorId,
          ],
        );
      await c.query(
        "UPDATE public.transactions SET status='COMPLETED',completed_at=now(),updated_at=now() WHERE id=$1",
        [transaction.id],
      );
      await c.query(
        `INSERT INTO public.pos_transactions(txn_id,txn_time,cashier,service,method,amount,status,report_date,cashier_id,cashier_staff_id,service_id,transaction_id) VALUES($1,to_char(now() AT TIME ZONE 'Asia/Manila','HH24:MI'),$2,$3,$4,$5,'Completed',$6,$7,$8,$9,$10)`,
        [
          'TXN-' + transaction.id,
          actor.name,
          lines
            .map((l) => l.name + (l.quantity > 1 ? ' ×' + l.quantity : ''))
            .join(', '),
          [...new Set(input.payments.map((p: any) => p.method))].join(' + '),
          amount(input.expected),
          day,
          actorId,
          actor.staff_id,
          lines.length === 1 ? lines[0].serviceId : null,
          transaction.id,
        ],
      );
      await insertOperationalEvent(
        {
          module: 'POS Reports',
          event: 'POS Checkout Completed',
          actorUserId: actorId,
          userName: actor.name,
          userRole: 'STAFF',
          details:
            'Saved transaction #' +
            transaction.id +
            ' with catalog service references and authenticated Staff ownership.',
        },
        c,
      );
      await c.query('COMMIT');
      return {
        success: true,
        id: transaction.id,
        total: amount(input.expected),
        cashier: actor.name,
      };
    } catch (e) {
      await c.query('ROLLBACK');
      if ((e as any)?.code === '23505')
        throw new ConflictException(
          'This checkout or payment reference was already recorded. Verify the existing sale before retrying.',
        );
      throw e;
    } finally {
      c.release();
    }
  }
}
