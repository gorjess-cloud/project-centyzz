import 'dotenv/config';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
} from '@nestjs/common';
import { Pool, type PoolClient } from 'pg';
import { createHash } from 'node:crypto';
import { insertOperationalEvent } from '../operational-logs/operational-logs.service.js';
import {
  amount,
  cents,
  moveDay,
  peso,
  reportDate,
  reportRange,
  reportToday,
  salesTotals,
  type Sale,
} from './report-math.js';
type Queryable = Pick<PoolClient, 'query'>;
@Injectable()
export class ReportsService implements OnModuleDestroy {
  readonly pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 4,
    connectionTimeoutMillis: 10000,
    query_timeout: 15000,
  });
  onModuleDestroy() {
    return this.pool.end();
  }
  async ledger(
    start: string,
    end: string,
    db: Queryable = this.pool,
  ): Promise<Sale[]> {
    // One row per sale. Aggregate line items/payments before joining to prevent multiplied totals.
    const queries = [
      () => db.query(
        `SELECT t.id::text,t.cashier_id,t.status,t.grand_total::text,
    to_char(coalesce(t.completed_at,t.voided_at,t.created_at) AT TIME ZONE 'Asia/Manila','YYYY-MM-DD') AS day,
    to_char(coalesce(t.completed_at,t.voided_at,t.created_at) AT TIME ZONE 'Asia/Manila','HH24:MI') AS time,
    coalesce(nullif(btrim(concat_ws(' ',u."firstName",u."lastName")),''),'Unlinked cashier') AS cashier,
    coalesce(items.names,'No linked items') AS names,coalesce(items.missing,false) AS missing,
    coalesce(pay.cash,0)::text AS cash,coalesce(pay.digital,0)::text AS digital,coalesce(pay.methods,'Unallocated') AS methods,
    t.updated_at::text AS revision
    FROM public.transactions t LEFT JOIN public.staff cashier_staff ON cashier_staff.id=t.cashier_staff_id LEFT JOIN public."user" u ON u.id=coalesce(cashier_staff.user_id,t.cashier_id)
    LEFT JOIN LATERAL(SELECT string_agg(coalesce(s.name,p.name,i.item_name)||CASE WHEN i.quantity>1 THEN ' ×'||i.quantity ELSE '' END,', ' ORDER BY i.id) AS names,
      bool_or(s.id IS NULL AND p.id IS NULL) AS missing FROM public.transaction_items i LEFT JOIN public.services s ON s.id=i.service_id LEFT JOIN public.products p ON p.id=i.product_id WHERE i.transaction_id=t.id AND i.removed_at IS NULL) items ON true
    LEFT JOIN LATERAL(SELECT sum(amount) FILTER(WHERE method='CASH') AS cash,sum(amount) FILTER(WHERE method<>'CASH') AS digital,string_agg(DISTINCT method,', ' ORDER BY method) AS methods FROM public.payments WHERE transaction_id=t.id AND status='SUCCEEDED') pay ON true
    WHERE t.status IN ('COMPLETED','VOIDED') AND (coalesce(t.completed_at,t.voided_at,t.created_at) AT TIME ZONE 'Asia/Manila')::date BETWEEN $1::date AND $2::date ORDER BY day,time,t.id`,
        [start, end],
      ),
      () => db.query(
        `SELECT p.id,p.txn_id,p.txn_time,p.cashier_id,p.service_id,p.product_id,p.amount::text,p.method,p.status,
    public.admin_report_day(p.report_date)::text AS day,p.service AS original_service,p.cashier AS original_cashier,
    coalesce(s.name,product.name,p.service) AS name,
    CASE WHEN u.id IS NOT NULL THEN btrim(concat_ws(' ',u."firstName",u."lastName")) ELSE nullif(btrim(p.cashier),'') END AS cashier,
    (u.id IS NULL OR (s.id IS NULL AND product.id IS NULL)) AS missing
    FROM public.pos_transactions p LEFT JOIN public.services s ON s.id=p.service_id LEFT JOIN public.products product ON product.id=p.product_id LEFT JOIN public.staff cashier_staff ON cashier_staff.id=p.cashier_staff_id LEFT JOIN public."user" u ON u.id=coalesce(cashier_staff.user_id,p.cashier_id)
    WHERE public.admin_report_day(p.report_date) BETWEEN $1::date AND $2::date
      AND NOT EXISTS(SELECT 1 FROM public.transactions t WHERE t.id=p.transaction_id)
    ORDER BY day,p.id`,
        [start, end],
      ),
    ];
    const [canonical,legacy]=db===this.pool?await Promise.all(queries.map(run=>run())):[await queries[0](),await queries[1]()];
    const rows: Sale[] = canonical.rows.map((r) => {
      const total = cents(r.grand_total),
        cash = cents(r.cash),
        digital = cents(r.digital);
      return {
        id: 'transaction:' + r.id,
        txnId: 'TXN-' + r.id,
        date: r.day,
        time: r.time,
        cashier: r.cashier,
        cashierId: r.cashier_id,
        service: r.names,
        method: r.methods,
        amountCents: total,
        cashCents: cash,
        digitalCents: digital,
        otherCents: total - cash - digital,
        status: r.status,
        source: 'transaction',
        unlinked: r.missing || !r.cashier_id,
        signature: r.revision,
      };
    });
    for (const r of legacy.rows) {
      const total = cents(r.amount),
        method = String(r.method).trim().toUpperCase(),
        cash = method === 'CASH' ? total : 0,
        digital = [
          'GCASH',
          'MAYA',
          'CARD',
          'DIGITAL',
          'BANK TRANSFER',
        ].includes(method)
          ? total
          : 0;
      rows.push({
        id: 'legacy:' + r.id,
        legacyId: r.id,
        txnId: r.txn_id,
        date: r.day,
        time: r.txn_time,
        cashier: r.cashier || 'Unlinked cashier',
        cashierId: r.cashier_id,
        service: r.name || 'Unlinked service',
        method,
        status: String(r.status).trim().toUpperCase(),
        amountCents: total,
        cashCents: cash,
        digitalCents: digital,
        otherCents: total - cash - digital,
        source: 'legacy',
        unlinked: r.missing,
        signature: [r.service_id, r.product_id, r.cashier_id].join(':'),
      });
    }
    return rows.sort((a, b) =>
      (a.date + ' ' + a.time + ' ' + a.id).localeCompare(
        b.date + ' ' + b.time + ' ' + b.id,
      ),
    );
  }
  signature(rows: Sale[]) {
    return createHash('sha256')
      .update(
        JSON.stringify(
          rows.map((r) => [
            r.id,
            r.date,
            r.status,
            r.amountCents,
            r.cashCents,
            r.digitalCents,
            r.otherCents,
            r.signature,
          ]),
        ),
      )
      .digest('hex');
  }
  displayRows(rows: Sale[]) {
    return rows.map(
      ({
        amountCents,
        cashCents,
        digitalCents,
        otherCents,
        signature,
        ...r
      }) => ({
        ...r,
        amount: amount(amountCents),
        cashAmount: amount(cashCents),
        digitalAmount: amount(digitalCents),
        unallocatedAmount: amount(otherCents),
      }),
    );
  }
  async report(
    start: string,
    end: string,
    db: Queryable = this.pool,
    staffUserId?: number,
  ) {
    const all = await this.ledger(start, end, db),
      rows = staffUserId
        ? all.filter((row) => row.cashierId === staffUserId)
        : all,
      totals = salesTotals(rows);
    return { start, end, rows, totals, signature: this.signature(rows) };
  }
  async getPosReportData(from?: string, to?: string, staffUserId?: number) {
    const { start, end } = reportRange(from, to);
    const report = await this.report(start, end, this.pool, staffUserId);
    const length =
      Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1;
    const previous = await this.report(
      moveDay(start, -length),
      moveDay(start, -1),
      this.pool,
      staffUserId,
    );
    const { totals: t } = report;
    const closeout =
      start === end
        ? (
            await this.pool.query(
              `SELECT r.*,coalesce(nullif(btrim(concat_ws(' ',u."firstName",u."lastName")),''),r.cashier) AS actor_name FROM public.closeout_reports r LEFT JOIN public."user" u ON u.id=coalesce(r.closed_by,r.cashier_id) WHERE public.admin_report_day(report_date)=$1::date AND r.archived_at IS NULL AND r.is_closed AND (($2::int IS NULL AND r.cashier_staff_id IS NULL) OR r.cashier_staff_id=(SELECT id FROM public.staff WHERE user_id=$2)) ORDER BY id DESC LIMIT 1`,
              [start, staffUserId ?? null],
            )
          ).rows[0]
        : null;
    const opening = closeout ? cents(closeout.opening_cash) : 0,
      actual =
        closeout?.actual_cash == null ? null : cents(closeout.actual_cash);
    const warnings = [];
    if (report.rows.some((r) => r.unlinked))
      warnings.push(
        'Some historical rows have unlinked service or Staff references. Their recorded labels and charged amounts are retained.',
      );
    if (t.other !== 0)
      warnings.push(
        'Payment allocation does not reconcile with recorded sales. Unallocated amounts are shown separately; resolve this before closing the day.',
      );
    if (
      report.rows.some(
        (r) => !['COMPLETED', 'VOIDED', 'REFUNDED'].includes(r.status),
      )
    )
      warnings.push(
        'Pending or unknown-status rows are excluded from completed sales.',
      );
    return {
      selectedDate: start,
      from: start,
      to: end,
      window: { earliest: moveDay(reportToday(), -29), latest: reportToday() },
      updatedAt: new Date().toISOString(),
      warnings,
      totals: {
        grossSales: amount(t.gross),
        refunds: amount(t.refunds),
        voided: amount(t.voided),
        netSales: amount(t.net),
        cashSales: amount(t.cash),
        digitalSales: amount(t.digital),
        unallocatedSales: amount(t.other),
        completedCount: t.completedCount,
        refundCount: t.refundCount,
      },
      kpiData: {
        totalSales: peso(t.net),
        totalSalesGrowth:
          previous.totals.net > 0
            ? (
                ((t.net - previous.totals.net) / previous.totals.net) *
                100
              ).toFixed(1) + '% vs previous period'
            : previous.totals.net === 0
              ? 'No comparable sales in previous period'
              : 'Previous period was negative',
        cashPayments: peso(t.cash),
        cashShare:
          t.net > 0
            ? ((t.cash / t.net) * 100).toFixed(1) + '% of net sales'
            : 'No positive net sales',
        digitalPayments: peso(t.digital),
        digitalMethods: 'Recorded non-cash payments',
        voidedRefunds: peso(t.voided + t.refunds),
        voidedCount:
          report.rows.filter((r) => ['VOIDED', 'REFUNDED'].includes(r.status))
            .length + ' transactions',
      },
      transactions: this.displayRows(report.rows),
      closeoutInfo: {
        register: closeout?.register_id || 'Salon register',
        cashier: closeout?.actor_name || '',
        openingCash: amount(opening),
        totalCashSales: amount(t.cash),
        totalDigitalSales: amount(t.digital),
        expectedCash: closeout ? Number(closeout.expected_cash) : amount(opening + t.cash),
        actualCashCount: actual === null ? null : amount(actual),
        discrepancy: closeout ? Number(closeout.discrepancy) : actual === null ? null : amount(actual - opening - t.cash),
        isClosed: !!closeout,
        sourceChanged:
          !!closeout?.source_signature &&
          closeout.source_signature !== report.signature,
      },
    };
  }
  async revenueForDates(date: string, previous: string) {
    reportDate(date);
    reportDate(previous);
    const data = await this.ledger(previous, date),
      today = salesTotals(data.filter((r) => r.date === date)),
      yesterday = salesTotals(data.filter((r) => r.date === previous));
    return {
      revenue: amount(today.net),
      previousRevenue: amount(yesterday.net),
    };
  }
  async getSavedCloseoutReports(from?: string, to?: string) {
    const { start, end } = reportRange(
      from ?? moveDay(reportToday(), -6),
      to ?? reportToday(),
    );
    const result = await this.pool.query(
      `SELECT r.id,public.admin_report_day(r.report_date)::text AS day,r.created_at,r.opening_cash,r.total_cash_sales,r.total_digital_sales,r.expected_cash,r.actual_cash,r.discrepancy,r.report_snapshot,r.source_signature,r.cashier_staff_id,coalesce(nullif(btrim(concat_ws(' ',u."firstName",u."lastName")),''),r.cashier) AS actor FROM public.closeout_reports r LEFT JOIN public."user" u ON u.id=coalesce(r.closed_by,r.cashier_id) WHERE r.archived_at IS NULL AND r.is_closed AND public.admin_report_day(report_date) BETWEEN $1::date AND $2::date ORDER BY day DESC,r.id DESC`,
      [start, end],
    );
    return result.rows.map((r) => ({
      id: String(r.id),
      date: r.day,
      cashier: r.actor || 'Recorded cashier unavailable',
      totalSales:
        r.report_snapshot?.totals?.netSales ??
        Number(r.total_cash_sales) + Number(r.total_digital_sales),
      openingCash: Number(r.opening_cash),
      cashSales: Number(r.total_cash_sales),
      digitalSales: Number(r.total_digital_sales),
      expectedCash: Number(r.expected_cash),
      actualCash: Number(r.actual_cash),
      discrepancy: Number(r.discrepancy),
      closedAt: r.created_at,
      snapshot: r.report_snapshot,
      legacy: !r.report_snapshot,
      scope: r.cashier_staff_id ? 'Staff cashier' : 'Salon daily',
    }));
  }
  async submitCloseout(actorId: number, body: any, staffScope = false) {
    const { start } = reportRange(body?.reportDate);
    if (body?.actualCash === undefined || body?.openingCash === undefined)
      throw new BadRequestException(
        'Enter opening cash and actual counted cash.',
      );
    const actual = cents(body.actualCash),
      opening = cents(body.openingCash);
    if (
      actual < 0 ||
      opening < 0 ||
      actual > 10000000000 ||
      opening > 10000000000
    )
      throw new BadRequestException('Enter valid non-negative cash amounts.');
    const c = await this.pool.connect();
    try {
      await c.query('BEGIN');
      await c.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        'centyzz-closeout:' + start,
      ]);
      const staff = staffScope
        ? (
            await c.query(
              'SELECT s.id FROM public.staff s JOIN public."user" u ON u.id=s.user_id WHERE s.user_id=$1 AND u.role=\'STAFF\' AND u."isActive" AND u.archived_at IS NULL AND s.archived_at IS NULL AND s.is_active',
              [actorId],
            )
          ).rows[0]
        : null;
      if (staffScope && !staff)
        throw new BadRequestException('An active Staff profile is required.');
      const existing = (
        await c.query(
          'SELECT id,opening_cash,actual_cash FROM public.closeout_reports WHERE public.admin_report_day(report_date)=$1::date AND archived_at IS NULL AND is_closed AND cashier_staff_id IS NOT DISTINCT FROM $2::uuid ORDER BY id DESC LIMIT 1',
          [start, staff?.id ?? null],
        )
      ).rows[0];
      if (existing) {
        if (
          cents(existing.opening_cash) === opening &&
          cents(existing.actual_cash) === actual
        ) {
          await c.query('COMMIT');
          return { success: true, id: existing.id, unchanged: true };
        }
        throw new ConflictException(
          'This day already has a saved closeout. Its recorded count cannot be overwritten.',
        );
      }
      const data = await this.report(
        start,
        start,
        c,
        staffScope ? actorId : undefined,
      );
      if (data.totals.other !== 0)
        throw new ConflictException(
          'Reconcile payment allocations before saving a closeout.',
        );
      const actor = (
        await c.query(
          'SELECT role,concat_ws(\' \',"firstName","lastName") AS name FROM public."user" WHERE id=$1',
          [actorId],
        )
      ).rows[0];
      const t = data.totals;
      const snapshot = {
        date: start,
        totals: {
          grossSales: amount(t.gross),
          refunds: amount(t.refunds),
          voided: amount(t.voided),
          netSales: amount(t.net),
          cashSales: amount(t.cash),
          digitalSales: amount(t.digital),
        },
        transactions: this.displayRows(data.rows),
      };
      const saved = (
        await c.query(
          `INSERT INTO public.closeout_reports(report_date,register_id,cashier,shift_hours,opening_cash,total_cash_sales,total_digital_sales,voided_amount,refunded_amount,expected_cash,actual_cash,discrepancy,is_closed,closed_by,report_snapshot,source_signature,cashier_id,cashier_staff_id) VALUES($1,'Salon register',$2,'Day closeout',$3,$4,$5,$6,$7,$8,$9,$10,true,$11,$12::jsonb,$13,$14,$15) RETURNING id`,
          [
            start,
            actor.name,
            amount(opening),
            amount(t.cash),
            amount(t.digital),
            amount(t.voided),
            amount(t.refunds),
            amount(opening + t.cash),
            amount(actual),
            amount(actual - opening - t.cash),
            actorId,
            JSON.stringify(snapshot),
            data.signature,
            staffScope ? actorId : null,
            staff?.id ?? null,
          ],
        )
      ).rows[0];
      await insertOperationalEvent(
        {
          module: 'POS Reports',
          event: 'Daily Closeout Saved',
          actorUserId: actorId,
          userName: actor.name,
          userRole: actor.role,
          details: 'Saved day closeout for ' + start + '.',
        },
        c,
      );
      await c.query('COMMIT');
      return { success: true, id: saved.id };
    } catch (e) {
      await c.query('ROLLBACK');
      if ((e as any)?.code === '23505' || (e as any)?.code === '40001')
        throw new ConflictException(
          'Another request saved this closeout. Refresh the report before trying again.',
        );
      throw e;
    } finally {
      c.release();
    }
  }
  async lookups() {
    const [services, products, staff] = await Promise.all([
      this.pool.query('SELECT id,name FROM public.services ORDER BY name'),
      this.pool.query('SELECT id,name FROM public.products ORDER BY name'),
      this.pool.query(
        'SELECT id,concat_ws(\' \',"firstName","lastName") AS name FROM public."user" WHERE role=\'STAFF\' AND "isActive" AND archived_at IS NULL ORDER BY "firstName"',
      ),
    ]);
    return {
      services: services.rows,
      products: products.rows,
      staff: staff.rows,
    };
  }
  async linkLegacy(actorId: number, id: number, body: any) {
    if (
      !Number.isSafeInteger(id) ||
      id < 1 ||
      !Number.isSafeInteger(body?.cashierId) ||
      body.cashierId < 1
    )
      throw new BadRequestException('Choose a Staff cashier.');
    const service = body.serviceId ?? null,
      product = body.productId ?? null;
    if (
      (service === null) === (product === null) ||
      ![service, product].every(
        (v) => v === null || (Number.isSafeInteger(v) && v > 0),
      )
    )
      throw new BadRequestException('Choose one service or inventory item.');
    const c = await this.pool.connect();
    try {
      await c.query('BEGIN');
      const row = (
        await c.query(
          'SELECT id,report_date,service_id,product_id,cashier_id,transaction_id FROM public.pos_transactions WHERE id=$1 FOR UPDATE',
          [id],
        )
      ).rows[0];
      if (!row) throw new NotFoundException('Report row not found.');
      if (row.transaction_id)
        throw new ConflictException(
          'This row is linked to an original checkout; its ownership is retained there.',
        );
      const day = (
        await c.query('SELECT public.admin_report_day($1)::text AS day', [
          row.report_date,
        ])
      ).rows[0].day;
      reportRange(day);
      if (
        !(
          await c.query(
            'SELECT id FROM public."user" WHERE id=$1 AND role=\'STAFF\' AND "isActive" AND archived_at IS NULL',
            [body.cashierId],
          )
        ).rowCount
      )
        throw new BadRequestException('Select an active Staff account.');
      if (
        !(
          await c.query(
            service
              ? 'SELECT id FROM public.services WHERE id=$1'
              : 'SELECT id FROM public.products WHERE id=$1',
            [service ?? product],
          )
        ).rowCount
      )
        throw new BadRequestException('The selected item no longer exists.');
      if (
        row.service_id === service &&
        row.product_id === product &&
        row.cashier_id === body.cashierId
      ) {
        await c.query('COMMIT');
        return { success: true, unchanged: true };
      }
      await c.query(
        'UPDATE public.pos_transactions SET service_id=$2,product_id=$3,cashier_id=$4,cashier_staff_id=(SELECT id FROM public.staff WHERE user_id=$4) WHERE id=$1',
        [id, service, product, body.cashierId],
      );
      const actor = (
        await c.query(
          'SELECT role,concat_ws(\' \',"firstName","lastName") AS name FROM public."user" WHERE id=$1',
          [actorId],
        )
      ).rows[0];
      await insertOperationalEvent(
        {
          module: 'POS Reports',
          event: 'Report References Linked',
          actorUserId: actorId,
          userName: actor.name,
          userRole: actor.role,
          details:
            'Linked service/item and Staff references for report row #' +
            id +
            '; charged amount preserved.',
        },
        c,
      );
      await c.query('COMMIT');
      return { success: true };
    } catch (e) {
      await c.query('ROLLBACK');
      throw e;
    } finally {
      c.release();
    }
  }
}
