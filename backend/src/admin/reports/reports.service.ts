import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import pg from 'pg';

/** Existing POS and closeout endpoints backed by the actual Neon SQL tables. */
@Injectable()
export class ReportsService implements OnModuleDestroy {
  private readonly logger = new Logger(ReportsService.name);
  private readonly pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5 });

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  private async queryDb(sql: string, params: unknown[] = []): Promise<any[]> {
    // Do not silently turn SQL errors into a valid-looking empty report.
    const result = await this.pool.query(sql, params);
    return result.rows;
  }

  /** The existing DB stores report_date as text, including older long-form dates. */
  private dateVariants(input: string): string[] {
    const value = String(input || '').trim();
    if (!value) throw new BadRequestException('A report date is required.');
    let year: number, month: number, day: number;
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (iso) {
      year = Number(iso[1]); month = Number(iso[2]); day = Number(iso[3]);
    } else {
      const parsed = new Date(value);
      if (!/^[A-Za-z]+\s+\d{1,2},\s*\d{4}$/.test(value) || Number.isNaN(parsed.getTime())) {
        throw new BadRequestException('Report date must be YYYY-MM-DD or Month D, YYYY.');
      }
      year = parsed.getUTCFullYear(); month = parsed.getUTCMonth() + 1; day = parsed.getUTCDate();
    }
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
      throw new BadRequestException('Invalid report date.');
    }
    const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const longDate = date.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' });
    const shortDate = date.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' });
    return Array.from(new Set([isoDate, longDate, shortDate].map((item) => item.toLowerCase())));
  }

  private async transactionsForDate(date: string): Promise<any[]> {
    return this.queryDb(
      `SELECT * FROM public.pos_transactions
       WHERE LOWER(TRIM(report_date)) = ANY($1::text[]) ORDER BY id ASC`,
      [this.dateVariants(date)],
    );
  }

  private async closeoutForDate(date: string): Promise<any | null> {
    const rows = await this.queryDb(
      `SELECT * FROM public.closeout_reports
       WHERE LOWER(TRIM(report_date)) = ANY($1::text[]) ORDER BY id DESC LIMIT 1`,
      [this.dateVariants(date)],
    );
    return rows[0] || null;
  }

  private totals(rows: any[]) {
    const completed = rows.filter((row) => String(row.status).toUpperCase() === 'COMPLETED');
    const cash = completed.filter((row) => String(row.method).toUpperCase() === 'CASH')
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const digital = completed.filter((row) => ['GCASH', 'MAYA', 'CARD'].includes(String(row.method).toUpperCase()))
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const voided = rows.filter((row) => String(row.status).toUpperCase() === 'VOIDED');
    const refunded = rows.filter((row) => String(row.status).toUpperCase() === 'REFUNDED');
    const sum = (items: any[]) => items.reduce((amount, row) => amount + Number(row.amount || 0), 0);
    return { cash, digital, total: cash + digital, voidedAmount: sum(voided), refundedAmount: sum(refunded), voidedCount: voided.length + refunded.length };
  }

  private money(value: number): string {
    return `₱${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  async getPosReportData(date: string) {
    try {
      const raw = await this.transactionsForDate(date);
      const closeout = await this.closeoutForDate(date);
      const sums = this.totals(raw);
      const openingCash = Number(closeout?.opening_cash ?? 5000);
      const expectedCash = openingCash + sums.cash;
      return {
        selectedDate: date,
        kpiData: {
          totalSales: this.money(sums.total),
          totalSalesGrowth: 'N/A', // No comparison period has been calculated.
          cashPayments: this.money(sums.cash),
          cashShare: `${sums.total ? ((sums.cash / sums.total) * 100).toFixed(1) : '0.0'}% of total`,
          digitalPayments: this.money(sums.digital),
          digitalMethods: 'GCash, Maya, Card',
          voidedRefunds: this.money(sums.voidedAmount + sums.refundedAmount),
          voidedCount: `${sums.voidedCount} transactions`,
        },
        transactions: raw.map((row) => ({
          txnId: row.txn_id || `TXN-${row.id}`,
          time: row.txn_time || '',
          cashier: row.cashier || '',
          service: row.service || '',
          method: row.method || '',
          amount: Number(row.amount || 0),
          status: row.status || '',
        })),
        closeoutInfo: {
          register: closeout?.register_id || 'Register 1',
          cashier: closeout?.cashier || '',
          shift: closeout?.shift_hours || '',
          openingCash,
          totalCashSales: sums.cash,
          totalDigitalSales: sums.digital,
          voidedRefunded: `${this.money(sums.voidedAmount)} / ${this.money(sums.refundedAmount)}`,
          expectedCash,
          actualCashCount: closeout?.actual_cash == null ? null : Number(closeout.actual_cash),
          discrepancy: Number(closeout?.discrepancy ?? 0),
          isClosed: Boolean(closeout?.is_closed),
        },
      };
    } catch (error) {
      this.logger.error('Failed to retrieve POS report', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  async getSavedCloseoutReports() {
    const rows = await this.queryDb('SELECT * FROM public.closeout_reports ORDER BY id DESC');
    return rows.map((row) => ({
      id: String(row.id), date: row.report_date,
      totalSales: Number(row.total_cash_sales || 0) + Number(row.total_digital_sales || 0),
      cashier: row.cashier || '',
    }));
  }

  async submitCloseout(dto: { reportDate: string; actualCash: number }) {
    const variants = this.dateVariants(dto?.reportDate);
    const actualCash = Number(dto?.actualCash);
    if (dto?.actualCash === undefined || dto?.actualCash === null || !Number.isFinite(actualCash) || actualCash < 0) {
      throw new BadRequestException('Actual cash must be a non-negative number.');
    }
    const existing = await this.closeoutForDate(dto.reportDate);
    const sums = this.totals(await this.transactionsForDate(dto.reportDate));
    const openingCash = Number(existing?.opening_cash ?? 5000);
    const expectedCash = openingCash + sums.cash;
    const discrepancy = actualCash - expectedCash;
    if (existing) {
      const updated = await this.queryDb(
        `UPDATE public.closeout_reports SET total_cash_sales=$1, total_digital_sales=$2,
         expected_cash=$3, actual_cash=$4, discrepancy=$5, is_closed=true, updated_at=NOW()
         WHERE id=$6 RETURNING *`,
        [sums.cash, sums.digital, expectedCash, actualCash, discrepancy, existing.id],
      );
      return updated[0];
    }
    const inserted = await this.queryDb(
      `INSERT INTO public.closeout_reports
        (report_date, opening_cash, total_cash_sales, total_digital_sales, expected_cash,
         actual_cash, discrepancy, is_closed, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,true,NOW(),NOW()) RETURNING *`,
      [variants[0], openingCash, sums.cash, sums.digital, expectedCash, actualCash, discrepancy],
    );
    return inserted[0];
  }

  async deleteCloseoutReport(id: number) {
    const rows = await this.queryDb('DELETE FROM public.closeout_reports WHERE id=$1 RETURNING id', [id]);
    if (!rows.length) throw new NotFoundException('Closeout report record not found.');
    return { success: true };
  }
}
