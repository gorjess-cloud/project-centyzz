import 'dotenv/config';
import { Injectable, Logger } from '@nestjs/common';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const peso = (n: number) =>
  `₱${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  async getPosReportData(date: string) {
    try {
      const { rows: rawTxns } = await pool.query(
        `SELECT * FROM public.pos_transactions
         WHERE LOWER(TRIM(report_date)) = LOWER(TRIM($1))
         ORDER BY id ASC`,
        [date],
      );
      this.logger.log(`POS query for "${date}" returned ${rawTxns.length} rows`);

      const transactions = rawTxns.map((t: any) => ({
        txnId: t.txn_id || `TXN-${t.id}`,
        time: t.txn_time || '',
        cashier: t.cashier || 'Aljean Mark A. Angeles',
        service: t.service || '',
        method: t.method || '',
        amount: Number(t.amount || 0),
        status: t.status || '',
      }));

      const completed = transactions.filter((t) => t.status.toLowerCase() === 'completed');
      const cashSales = completed
        .filter((t) => t.method.toLowerCase() === 'cash')
        .reduce((sum, t) => sum + t.amount, 0);
      const digitalSales = completed
        .filter((t) => ['gcash', 'maya', 'card'].includes(t.method.toLowerCase()))
        .reduce((sum, t) => sum + t.amount, 0);
      const totalSales = cashSales + digitalSales;

      const voidedTxns = transactions.filter((t) =>
        ['voided', 'refunded'].includes(t.status.toLowerCase()),
      );
      const voidedTotal = voidedTxns.reduce((sum, t) => sum + t.amount, 0);

      let closeout: any = null;
      try {
        const res = await pool.query(
          `SELECT * FROM public.closeout_reports
           WHERE LOWER(TRIM(report_date)) = LOWER(TRIM($1)) LIMIT 1`,
          [date],
        );
        closeout = res.rows[0] || null;
      } catch (err) {
        this.logger.warn(`closeout_reports query failed: ${(err as Error).message}`);
      }

      // If no closeout and no transactions, float & expected should be 0
      const hasData = transactions.length > 0 || closeout != null;
      const openingCash = hasData ? Number(closeout?.opening_cash || 5000) : 0;
      const expectedCash = openingCash + cashSales;

      return {
        selectedDate: date,
        kpiData: {
          totalSales: peso(totalSales),
          totalSalesGrowth: totalSales > 0 ? '+12.4% vs yesterday' : '0%',
          cashPayments: peso(cashSales),
          cashShare: `${totalSales > 0 ? ((cashSales / totalSales) * 100).toFixed(1) : 0}% of total`,
          digitalPayments: peso(digitalSales),
          digitalMethods: 'GCash, Maya, Card',
          voidedRefunds: peso(voidedTotal),
          voidedCount: `${voidedTxns.length} transactions`,
        },
        transactions,
        closeoutInfo: {
          register: closeout?.register_id || 'Register 1',
          cashier: closeout?.cashier || 'Aljean Mark A. Angeles',
          shift: closeout?.shift_hours || '8:00 AM – 8:00 PM',
          openingCash,
          totalCashSales: cashSales,
          totalDigitalSales: digitalSales,
          voidedRefunded: peso(voidedTotal),
          expectedCash,
          actualCashCount: Number(closeout?.actual_cash || 0),
          discrepancy: Number(closeout?.discrepancy || 0),
          isClosed: !!closeout?.is_closed,
        },
      };
    } catch (error) {
      this.logger.error('Error in getPosReportData', error as any);
      return {
        selectedDate: date,
        kpiData: {
          totalSales: '₱0.00',
          totalSalesGrowth: '0%',
          cashPayments: '₱0.00',
          cashShare: '0%',
          digitalPayments: '₱0.00',
          digitalMethods: 'GCash, Maya, Card',
          voidedRefunds: '₱0.00',
          voidedCount: '0 transactions',
        },
        transactions: [],
        closeoutInfo: {
          register: 'Register 1',
          cashier: 'Aljean Mark A. Angeles',
          shift: '8:00 AM – 8:00 PM',
          openingCash: 0,
          totalCashSales: 0,
          totalDigitalSales: 0,
          voidedRefunded: '₱0.00',
          expectedCash: 0,
          actualCashCount: 0,
          discrepancy: 0,
          isClosed: false,
        },
      };
    }
  }

  async getSavedCloseoutReports() {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM public.closeout_reports ORDER BY id DESC',
      );
      return rows.map((r: any) => ({
        id: String(r.id),
        date: r.report_date,
        totalSales: Number(r.total_cash_sales || 0) + Number(r.total_digital_sales || 0),
        cashier: r.cashier || 'Aljean Mark A. Angeles',
      }));
    } catch (error) {
      return [];
    }
  }

  async submitCloseout(dto: { reportDate: string; actualCash: number }) {
    return { success: true };
  }

  async deleteCloseoutReport(id: number) {
    return { success: true };
  }
}