import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import pg from 'pg';

/** Superadmin-owned POS Reports. Admin controllers/services are never imported. */
@Injectable()
export class SuperadminReportsService implements OnModuleDestroy {
  private readonly logger = new Logger(SuperadminReportsService.name);
  private readonly pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5 });

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  private async queryDb(sql: string, params: unknown[] = []): Promise<any[]> {
    const result = await this.pool.query(sql, params);
    return result.rows;
  }

  /** Neon currently contains both ISO and long-form text report dates. */
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
    const completed = rows.filter((row) => String(row.status).trim().toUpperCase() === 'COMPLETED');
    const cash = completed.filter((row) => String(row.method).trim().toUpperCase() === 'CASH')
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const digital = completed.filter((row) => ['GCASH', 'MAYA', 'CARD'].includes(String(row.method).trim().toUpperCase()))
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const voided = rows.filter((row) => String(row.status).trim().toUpperCase() === 'VOIDED');
    const refunded = rows.filter((row) => String(row.status).trim().toUpperCase() === 'REFUNDED');
    const sum = (items: any[]) => items.reduce((amount, row) => amount + Number(row.amount || 0), 0);
    return {
      cash, digital, total: cash + digital,
      voidedAmount: sum(voided), refundedAmount: sum(refunded),
      voidedCount: voided.length + refunded.length,
    };
  }

  private money(value: number): string {
    return `₱${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  /** Compare cents, so floating point rounding cannot trigger false reconciliation alerts. */
  private cents(value: unknown): number {
    return Math.round(Number(value || 0) * 100);
  }

  async getPosReportData(date: string) {
    try {
      const raw = await this.transactionsForDate(date);
      const closeout = await this.closeoutForDate(date);
      const sums = this.totals(raw);
      const hasCloseoutRecord = Boolean(closeout);
      const openingCash = Number(closeout?.opening_cash ?? 5000);
      const savedCash = Number(closeout?.total_cash_sales ?? 0);
      const savedDigital = Number(closeout?.total_digital_sales ?? 0);
      const mismatch = hasCloseoutRecord &&
        (this.cents(savedCash) !== this.cents(sums.cash) ||
         this.cents(savedDigital) !== this.cents(sums.digital));

      const reconciliationIssues: string[] = [];
      if (!raw.length) {
        reconciliationIssues.push('No POS transactions have been recorded for this date.');
      }
      if (mismatch) {
        reconciliationIssues.push(
          `Saved closeout sales (${this.money(savedCash + savedDigital)}) do not match POS history (${this.money(sums.total)}). Neither figure has been overwritten.`,
        );
      }
      if (closeout?.is_closed && this.cents(closeout.actual_cash) === 0 &&
          this.cents(closeout.discrepancy) === 0 && this.cents(closeout.expected_cash) > 0) {
        reconciliationIssues.push('This historical closed report has zero actual cash and zero discrepancy; verify its cash reconciliation.');
      }
      const canClose = !closeout?.is_closed && raw.length > 0 && !mismatch;

      return {
        selectedDate: date,
        // The headline KPIs ALWAYS describe POS transaction history, not legacy closeout snapshots.
        kpiData: {
          totalSales: this.money(sums.total),
          totalSalesGrowth: 'N/A',
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
          shift: closeout?.shift_hours || '8:00 AM – 8:00 PM',
          openingCash,
          // When a saved closeout exists, show its ORIGINAL stored values instead of
          // replacing them with calculated POS numbers that may not match historical data.
          totalCashSales: hasCloseoutRecord ? savedCash : sums.cash,
          totalDigitalSales: hasCloseoutRecord ? savedDigital : sums.digital,
          voidedRefunded: `${this.money(hasCloseoutRecord ? Number(closeout.voided_amount || 0) : sums.voidedAmount)} / ${this.money(hasCloseoutRecord ? Number(closeout.refunded_amount || 0) : sums.refundedAmount)}`,
          expectedCash: hasCloseoutRecord ? Number(closeout.expected_cash) : openingCash + sums.cash,
          actualCashCount: closeout?.actual_cash == null ? null : Number(closeout.actual_cash),
          discrepancy: closeout?.discrepancy == null ? null : Number(closeout.discrepancy),
          isClosed: Boolean(closeout?.is_closed),
          hasCloseoutRecord,
          canClose,
          reconciliationIssues,
        },
      };
    } catch (error) {
      this.logger.error('Failed to retrieve Superadmin POS report', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  async getSavedCloseoutReports() {
    const rows = await this.queryDb('SELECT * FROM public.closeout_reports ORDER BY id DESC');
    return rows.map((row) => ({
      id: String(row.id), date: row.report_date,
      totalSales: Number(row.total_cash_sales || 0) + Number(row.total_digital_sales || 0),
      cashier: row.cashier || '', isClosed: Boolean(row.is_closed),
    }));
  }

  async submitCloseout(dto: { reportDate: string; actualCash: number; cashier?: string }) {
    const variants = this.dateVariants(dto?.reportDate);
    const actualCash = Number(dto?.actualCash);
    if (dto?.actualCash === undefined || dto?.actualCash === null ||
        !Number.isFinite(actualCash) || actualCash < 0 || Math.abs(actualCash * 100 - Math.round(actualCash * 100)) > 0.000001) {
      throw new BadRequestException('Actual cash must be a non-negative amount with at most two decimal places.');
    }
    const existing = await this.closeoutForDate(dto.reportDate);
    if (existing?.is_closed) throw new ConflictException('This date has already been closed.');

    const transactions = await this.transactionsForDate(dto.reportDate);
    if (!transactions.length) {
      throw new ConflictException('Cannot close this date until POS transaction records are available.');
    }
    const sums = this.totals(transactions);
    if (existing && (this.cents(existing.total_cash_sales) !== this.cents(sums.cash) ||
        this.cents(existing.total_digital_sales) !== this.cents(sums.digital))) {
      throw new ConflictException('Saved closeout and POS totals differ. Review the report before closing.');
    }
    const openingCash = Number(existing?.opening_cash ?? 5000);
    const expectedCash = openingCash + sums.cash;
    const discrepancy = actualCash - expectedCash;

    if (existing) {
      const updated = await this.queryDb(
        `UPDATE public.closeout_reports SET total_cash_sales=$1, total_digital_sales=$2,
         voided_amount=$3, refunded_amount=$4, expected_cash=$5, actual_cash=$6,
         discrepancy=$7, is_closed=true, updated_at=NOW()
         WHERE id=$8 AND is_closed=false RETURNING *`,
        [sums.cash, sums.digital, sums.voidedAmount, sums.refundedAmount,
         expectedCash, actualCash, discrepancy, existing.id],
      );
      if (!updated.length) throw new ConflictException('This closeout was already completed. Refresh the report.');
      return updated[0];
    }

    // cashier is NOT NULL in the verified Neon schema. Require the actual cashier
    // on duty rather than inventing one or using the Superadmin account as cashier.
    const cashier = String(dto?.cashier || '').trim();
    if (!cashier || cashier.length > 200) {
      throw new BadRequestException('Cashier on duty is required for a new closeout (maximum 200 characters).');
    }
    const inserted = await this.queryDb(
      `INSERT INTO public.closeout_reports
        (report_date, cashier, opening_cash, total_cash_sales, total_digital_sales,
         voided_amount, refunded_amount, expected_cash, actual_cash, discrepancy,
         is_closed, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,NOW(),NOW()) RETURNING *`,
      [variants[0], cashier, openingCash, sums.cash, sums.digital, sums.voidedAmount,
       sums.refundedAmount, expectedCash, actualCash, discrepancy],
    );
    return inserted[0];
  }

  async deleteCloseoutReport(id: number) {
    const rows = await this.queryDb('DELETE FROM public.closeout_reports WHERE id=$1 RETURNING id', [id]);
    if (!rows.length) throw new NotFoundException('Closeout report record not found.');
    return { success: true };
  }
}
