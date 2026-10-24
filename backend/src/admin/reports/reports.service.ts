import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import pg from 'pg';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  private pool: pg.Pool;

  constructor() {
    this.pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // Direct connection to Neon DB
    });
  }

  // Execute raw SQL directly against Neon PostgreSQL
  private async queryDb(sql: string, params: any[] = []): Promise<any[]> {
    try {
      const res = await this.pool.query(sql, params);
      return res.rows || [];
    } catch (err) {
      this.logger.error('Direct Neon SQL Error:', err);
      return [];
    }
  }

  // 1. Fetch POS Summary Data & Transactions
  async getPosReportData(date: string) {
    try {
      const cleanDate = (date || '').trim();

      // Direct SQL query to public.pos_transactions
      let rawTxns: any[] = await this.queryDb(
        `SELECT * FROM public.pos_transactions WHERE report_date ILIKE $1 ORDER BY id ASC;`,
        [`%${cleanDate}%`]
      );

      // Diagnostic logging in terminal
      console.log(`[NEON DIRECT DIAGNOSTIC] Found ${rawTxns.length} transactions for date "${cleanDate}"`);

      // Fallback: If strict date filter returns 0, query all rows and filter
      if (!rawTxns || rawTxns.length === 0) {
        const allTxns = await this.queryDb('SELECT * FROM public.pos_transactions ORDER BY id ASC;');
        console.log(`[NEON DIRECT DIAGNOSTIC] Total rows in pos_transactions: ${allTxns.length}`);
        
        if (allTxns && allTxns.length > 0) {
          rawTxns = allTxns.filter((t: any) => 
            String(t.report_date || '').toLowerCase().includes(cleanDate.toLowerCase())
          );
        }
      }

      const transactions = (rawTxns || []).map((t: any) => ({
        txnId: t.txn_id || t.txnId || `TXN-${t.id}`,
        time: t.txn_time || t.txnTime || '12:00 PM',
        cashier: t.cashier || 'Aljean A.',
        service: t.service,
        method: t.method,
        amount: Number(t.amount || 0),
        status: t.status,
      }));

      // Financial Calculations
      const completedTxns = transactions.filter((t: any) => t.status === 'Completed');
      const cashSales = completedTxns
        .filter((t: any) => t.method === 'Cash')
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      const digitalSales = completedTxns
        .filter((t: any) => ['GCash', 'Maya', 'Card'].includes(t.method))
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      const totalSales = cashSales + digitalSales;

      const voidedRefundsTxns = transactions.filter((t: any) => ['Voided', 'Refunded'].includes(t.status));
      const voidedRefundsTotal = voidedRefundsTxns.reduce((sum: number, t: any) => sum + t.amount, 0);

      // Closeout Record Lookup
      const closeouts: any[] = await this.queryDb(
        `SELECT * FROM public.closeout_reports WHERE report_date ILIKE $1;`,
        [`%${cleanDate}%`]
      );
      const closeout = closeouts?.[0] || null;

      const openingCash = Number(closeout?.opening_cash || 5000);
      const expectedCash = openingCash + cashSales;

      return {
        selectedDate: cleanDate,
        kpiData: {
          totalSales: `₱${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          totalSalesGrowth: '+12.4% vs yesterday',
          cashPayments: `₱${cashSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          cashShare: `${totalSales > 0 ? ((cashSales / totalSales) * 100).toFixed(1) : 0}% of total`,
          digitalPayments: `₱${digitalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          digitalMethods: 'GCash, Maya, Card',
          voidedRefunds: `₱${voidedRefundsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          voidedCount: `${voidedRefundsTxns.length} transactions`,
        },
        transactions,
        closeoutInfo: {
          register: closeout?.register_id || 'Register 1',
          cashier: closeout?.cashier || 'Aljean Mark A. Angeles',
          shift: closeout?.shift_hours || '8:00 AM – 8:00 PM',
          openingCash,
          totalCashSales: cashSales,
          totalDigitalSales: digitalSales,
          voidedRefunded: `₱800.00 / ₱400.00`,
          expectedCash,
          actualCashCount: Number(closeout?.actual_cash || 0),
          discrepancy: Number(closeout?.discrepancy || 0),
          isClosed: !!closeout?.is_closed,
        },
      };
    } catch (error) {
      this.logger.error('Error fetching POS report data:', error);
      throw new BadRequestException('Failed to fetch POS report data.');
    }
  }

  // 2. Fetch All Saved Closeout Reports
  async getSavedCloseoutReports() {
    try {
      const reports: any[] = await this.queryDb('SELECT * FROM public.closeout_reports ORDER BY id DESC;');
      return (reports || []).map((r: any) => {
        const cash = Number(r.total_cash_sales || 0);
        const digital = Number(r.total_digital_sales || 0);
        return {
          id: String(r.id),
          date: r.report_date,
          totalSales: cash + digital,
          cashier: r.cashier || 'Aljean Mark A. Angeles',
        };
      });
    } catch (error) {
      this.logger.error('Error fetching closeout reports:', error);
      return [];
    }
  }

  // 3. Submit Register Closeout
  async submitCloseout(dto: { reportDate: string; actualCash: number }) {
    const cleanDate = (dto.reportDate || '').trim();
    const existing: any[] = await this.queryDb(
      'SELECT * FROM public.closeout_reports WHERE report_date ILIKE $1;',
      [`%${cleanDate}%`]
    );
    const closeout = existing?.[0];
    const openingCash = Number(closeout?.opening_cash || 5000);
    const totalCash = Number(closeout?.total_cash_sales || 0);
    const expectedCash = openingCash + totalCash;
    const discrepancy = Number(dto.actualCash) - expectedCash;

    if (closeout) {
      const updated: any[] = await this.queryDb(
        `UPDATE public.closeout_reports 
         SET actual_cash = $1, discrepancy = $2, is_closed = true, updated_at = NOW() 
         WHERE report_date ILIKE $3 RETURNING *;`,
        [dto.actualCash, discrepancy, `%${cleanDate}%`]
      );
      return updated[0];
    }

    const created: any[] = await this.queryDb(
      `INSERT INTO public.closeout_reports 
       (report_date, cashier, opening_cash, total_cash_sales, expected_cash, actual_cash, discrepancy, is_closed, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW()) RETURNING *;`,
      [cleanDate, 'Aljean Mark A. Angeles', openingCash, totalCash, expectedCash, dto.actualCash, discrepancy]
    );
    return created[0];
  }

  // 4. Delete Closeout Report
  async deleteCloseoutReport(id: number) {
    const record: any[] = await this.queryDb('SELECT * FROM public.closeout_reports WHERE id = $1;', [id]);
    if (!record || record.length === 0) throw new NotFoundException('Closeout report record not found.');

    await this.queryDb('DELETE FROM public.closeout_reports WHERE id = $1;', [id]);
    return { success: true };
  }
}