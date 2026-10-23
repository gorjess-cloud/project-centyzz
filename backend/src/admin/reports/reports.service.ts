import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { db } from '../../prisma/db.js';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  private get transactionModel(): any {
    const publicSchema = (db as any)?.orm?.public || (db as any)?.orm || db;
    return publicSchema?.pos_transactions || publicSchema?.posTransactions || publicSchema?.PosTransaction;
  }

  private get closeoutModel(): any {
    const publicSchema = (db as any)?.orm?.public || (db as any)?.orm || db;
    return publicSchema?.closeout_reports || publicSchema?.closeoutReports || publicSchema?.CloseoutReport;
  }

  // 1. Fetch POS Summary Data & Transactions for a specific date
  async getPosReportData(date: string) {
    try {
      const txnModel = this.transactionModel;
      const closeoutModel = this.closeoutModel;

      let rawTxns: any[] = [];
      if (txnModel && typeof txnModel.where === 'function') {
        const allTxns = await txnModel.where({}).all();
        console.log('--- NEON POS FETCH DIAGNOSTIC ---');
        console.log(`Total transactions returned from DB: ${allTxns ? allTxns.length : 0}`);
        if (allTxns && allTxns.length > 0) {
          console.log('Sample Transaction Cashier:', allTxns[0].cashier);
        }
        console.log('---------------------------------');
        
        rawTxns = allTxns.filter((t: any) => (t.report_date || t.reportDate) === date);
      }

      const transactions = rawTxns.map((t: any) => ({
        txnId: t.txn_id || t.txnId,
        time: t.txn_time || t.txnTime,
        cashier: t.cashier,
        service: t.service,
        method: t.method,
        amount: Number(t.amount || 0),
        status: t.status,
      }));

      // Calculate financials dynamically
      const completedTxns = transactions.filter((t) => t.status === 'Completed');
      const cashSales = completedTxns
        .filter((t) => t.method === 'Cash')
        .reduce((sum, t) => sum + t.amount, 0);

      const digitalSales = completedTxns
        .filter((t) => ['GCash', 'Maya', 'Card'].includes(t.method))
        .reduce((sum, t) => sum + t.amount, 0);

      const totalSales = cashSales + digitalSales;

      const voidedRefundsTxns = transactions.filter((t) => ['Voided', 'Refunded'].includes(t.status));
      const voidedRefundsTotal = voidedRefundsTxns.reduce((sum, t) => sum + t.amount, 0);

      // Fetch or sync closeout record
      let closeout: any = null;
      if (closeoutModel && typeof closeoutModel.where === 'function') {
        closeout = await closeoutModel.where({ reportDate: date }).first();
      }

      const openingCash = Number(closeout?.opening_cash || closeout?.openingCash || 5000);
      const expectedCash = openingCash + cashSales;

      return {
        selectedDate: date,
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
          register: closeout?.register_id || closeout?.registerId || 'Register 1',
          cashier: closeout?.cashier || 'Aljean Mark A. Angeles',
          shift: closeout?.shift_hours || closeout?.shiftHours || '8:00 AM – 8:00 PM',
          openingCash,
          totalCashSales: cashSales,
          totalDigitalSales: digitalSales,
          voidedRefunded: `₱800.00 / ₱400.00`,
          expectedCash,
          actualCashCount: closeout?.actual_cash || closeout?.actualCash || 0,
          discrepancy: closeout?.discrepancy || 0,
          isClosed: !!(closeout?.is_closed || closeout?.isClosed),
        },
      };
    } catch (error) {
      this.logger.error('Error fetching POS report data:', error);
      throw new BadRequestException('Failed to fetch POS report data.');
    }
  }

  // 2. Fetch All Daily Closeout Reports (for Closeout Reports Modal)
  async getSavedCloseoutReports() {
    try {
      const closeoutModel = this.closeoutModel;
      if (!closeoutModel || typeof closeoutModel.where !== 'function') return [];

      const reports = await closeoutModel.where({}).all();
      return reports.map((r: any) => {
        const cash = Number(r.total_cash_sales || r.totalCashSales || 0);
        const digital = Number(r.total_digital_sales || r.totalDigitalSales || 0);
        return {
          id: String(r.id),
          date: r.report_date || r.reportDate,
          totalSales: cash + digital,
          cashier: r.cashier,
        };
      });
    } catch (error) {
      this.logger.error('Error fetching closeout reports:', error);
      return [];
    }
  }

  // 3. Submit Register Closeout
  async submitCloseout(dto: { reportDate: string; actualCash: number }) {
    const closeoutModel = this.closeoutModel;
    if (!closeoutModel) throw new BadRequestException('Closeout model uninitialized.');

    const closeout = await closeoutModel.where({ reportDate: dto.reportDate }).first();
    const openingCash = Number(closeout?.opening_cash || closeout?.openingCash || 5000);
    const totalCash = Number(closeout?.total_cash_sales || closeout?.totalCashSales || 0);
    const expectedCash = openingCash + totalCash;
    const discrepancy = Number(dto.actualCash) - expectedCash;

    if (closeout) {
      return await closeoutModel.where({ id: closeout.id }).update({
        actual_cash: dto.actualCash,
        discrepancy,
        is_closed: true,
        updated_at: new Date().toISOString(),
      });
    }

    return await closeoutModel.create({
      report_date: dto.reportDate,
      cashier: 'Aljean Mark A. Angeles',
      opening_cash: openingCash,
      total_cash_sales: totalCash,
      expected_cash: expectedCash,
      actual_cash: dto.actualCash,
      discrepancy,
      is_closed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // 4. Delete Closeout Report
  async deleteCloseoutReport(id: number) {
    const closeoutModel = this.closeoutModel;
    if (!closeoutModel) throw new NotFoundException('Closeout model uninitialized.');

    const record = await closeoutModel.where({ id: Number(id) }).first();
    if (!record) throw new NotFoundException('Closeout report record not found.');

    return await closeoutModel.where({ id: Number(id) }).delete();
  }
}