import { useState } from 'react';
import { 
  Bell, 
  Search, 
  Moon, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  DollarSign,
  Printer,
  FileText,
  CreditCard,
  ChevronDown,
  Download,
  AlertTriangle,
  X,
  SlidersHorizontal
} from 'lucide-react';

export default function POSReportsView({ showHeaderActions = true }) {
  const [selectedDate, setSelectedDate] = useState('August 20, 2026');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [actualCashCount, setActualCashCount] = useState('');
  
  // Modals
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isCloseoutModalOpen, setIsCloseoutModalOpen] = useState(false);
  const [isReportsListModalOpen, setIsReportsListModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isRegisterClosed, setIsRegisterClosed] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  // Daily Saved Closeout Reports List
  const [savedCloseoutReports, setSavedCloseoutReports] = useState([
    { id: '1', date: 'August 20, 2026', totalSales: 24850.00, cashier: 'Aljean Mark A. Angeles' },
    { id: '2', date: 'August 19, 2026', totalSales: 18400.00, cashier: 'Jessica P.' },
    { id: '3', date: 'August 18, 2026', totalSales: 21150.00, cashier: 'Aljean Mark A. Angeles' },
    { id: '4', date: 'August 17, 2026', totalSales: 19600.00, cashier: 'Jessica P.' },
  ]);

  const [selectedReportForInvoice, setSelectedReportForInvoice] = useState(null);

  // Key KPI Data
  const kpiData = {
    totalSales: '₱24,850.00',
    totalSalesGrowth: '+12.4% vs yesterday',
    cashPayments: '₱15,320.00',
    cashShare: '61.6% of total',
    digitalPayments: '₱9,530.00',
    digitalMethods: 'GCash, Maya, Card',
    voidedRefunds: '₱1,200.00',
    voidedCount: '4 transactions'
  };

  // Transaction History Data
  const [transactions] = useState([
    {
      txnId: 'TXN-3891',
      time: '05:14 PM',
      cashier: 'Aljean A.',
      service: 'Balayage & Couture Color',
      method: 'GCash',
      amount: 4500.00,
      status: 'Completed'
    },
    {
      txnId: 'TXN-3890',
      time: '04:30 PM',
      cashier: 'Aljean A.',
      service: "Women's Precision Cut",
      method: 'Cash',
      amount: 650.00,
      status: 'Completed'
    },
    {
      txnId: 'TXN-3889',
      time: '03:15 PM',
      cashier: 'Aljean A.',
      service: 'Gel Manicure & Nail Art',
      method: 'Maya',
      amount: 1200.00,
      status: 'Completed'
    },
    {
      txnId: 'TXN-3888',
      time: '02:00 PM',
      cashier: 'Jessica P.',
      service: 'Brazilian Blowout',
      method: 'Card',
      amount: 3500.00,
      status: 'Completed'
    },
    {
      txnId: 'TXN-3887',
      time: '01:10 PM',
      cashier: 'Jessica P.',
      service: 'Hair Extension Wash',
      method: 'Cash',
      amount: 800.00,
      status: 'Voided'
    },
    {
      txnId: 'TXN-3886',
      time: '11:45 AM',
      cashier: 'Aljean A.',
      service: 'Keratin Nourish Spa',
      method: 'Cash',
      amount: 1500.00,
      status: 'Completed'
    },
    {
      txnId: 'TXN-3885',
      time: '10:30 AM',
      cashier: 'Aljean A.',
      service: "Gentlemen's Hair Cut",
      method: 'GCash',
      amount: 450.00,
      status: 'Completed'
    },
    {
      txnId: 'TXN-3884',
      time: '09:15 AM',
      cashier: 'Jessica P.',
      service: 'Eyelash Extensions',
      method: 'Maya',
      amount: 400.00,
      status: 'Refunded'
    }
  ]);

  // Financial Calculations
  const openingCash = 5000.00;
  const totalCashSales = transactions
    .filter(t => t.method === 'Cash' && t.status === 'Completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDigitalSales = transactions
    .filter(t => (t.method === 'GCash' || t.method === 'Maya' || t.method === 'Card') && t.status === 'Completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const expectedCash = openingCash + totalCashSales;
  const actualCashNum = parseFloat(actualCashCount.replace(/[^0-9.]/g, '')) || 0;
  const discrepancy = actualCashCount !== '' ? actualCashNum - expectedCash : 0;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Trigger CSV Download after confirmation
  const handleConfirmExportCSV = () => {
    const headers = ["Txn ID,Time,Cashier,Service,Method,Amount,Status\n"];
    const rows = transactions.map(t => 
      `${t.txnId},${t.time},${t.cashier},"${t.service}",${t.method},₱${t.amount.toFixed(2)},${t.status}`
    );
    
    const blob = new Blob([headers + rows.join("\n")], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Centyzz_POS_Report_${selectedDate.replace(/\s+/g, '_')}.csv`;
    a.click();
    setIsExportModalOpen(false);
    showToast(`Successfully downloaded POS Transactions CSV for ${selectedDate}`);
  };

  const handleConfirmCloseout = () => {
    setIsRegisterClosed(true);
    setIsCloseoutModalOpen(false);
    
    const newReport = {
      id: String(Date.now()),
      date: selectedDate,
      totalSales: 24850.00,
      cashier: 'Aljean Mark A. Angeles'
    };
    setSavedCloseoutReports([newReport, ...savedCloseoutReports]);
    showToast(`Register closed successfully for ${selectedDate}`);
  };

  const handleDeleteReport = (id, reportDate) => {
    setSavedCloseoutReports(savedCloseoutReports.filter(r => r.id !== id));
    showToast(`Deleted closeout report for ${reportDate}`);
  };

  const handleViewReportInvoice = (report) => {
    setSelectedReportForInvoice(report);
    setIsReportsListModalOpen(false);
    setIsInvoiceModalOpen(true);
  };

  const filteredTransactions = transactions.filter(t => {
    if (activeFilter === 'CASH') return t.method === 'Cash';
    if (activeFilter === 'DIGITAL') return t.method === 'GCash' || t.method === 'Maya' || t.method === 'Card';
    if (activeFilter === 'VOIDED') return t.status === 'Voided' || t.status === 'Refunded';
    return true;
  });

  const filteredReportsList = savedCloseoutReports.filter(r => 
    r.date.toLowerCase().includes(filterSearch.toLowerCase())
  );

  const renderStatusBadge = (status) => {
    if (status === 'Completed') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 size={10} /> Completed
        </span>
      );
    }
    if (status === 'Voided') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
          Voided
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
        Refunded
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-[#3A342B] text-[#F5F1EA] px-4 py-3 rounded-xl shadow-xl border border-[#C5A059]/40 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-[#C5A059]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Balanced Header Bar */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title Grouping */}
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-[#2A1E1B] truncate">POS Reports</h1>
          <p className="mt-0.5 text-xs text-[#8A8174] truncate">
            Analyze daily revenue, drawer closeouts, and transaction history
          </p>
        </div>

        {/* Right Controls Container */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          
          {/* Group 1: Filter & Export Actions */}
          <div className="flex items-center gap-2 border-r border-[#E7DFD4] pr-3">
            {/* Date Picker Selector */}
            <div className="relative">
              <select 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="appearance-none bg-[#F8F5F0] hover:bg-[#E7DFD4] border border-[#E7DFD4] text-[#2A1E1B] font-bold text-xs px-3.5 py-2 pr-8 rounded-xl outline-none cursor-pointer transition-colors shadow-2xs"
              >
                <option value="August 20, 2026">August 20, 2026</option>
                <option value="August 19, 2026">August 19, 2026</option>
                <option value="August 18, 2026">August 18, 2026</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#8A8174] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Export CSV Button (Triggers Confirmation Modal) */}
            <button 
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E7DFD4] bg-white text-[#2A1E1B] hover:bg-[#F6F0E6] text-xs font-bold transition-colors shadow-2xs"
            >
              <Download size={14} className="text-[#C5A059]" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Group 2: System Quick Actions */}
          {showHeaderActions && (<div className="flex items-center gap-2 shrink-0">
          <button className="p-2.5 rounded-full border border-[#E7DFD4] bg-white text-[#2A1E1B] hover:bg-[#F6F0E6] transition-colors">
            <Moon size={16} />
          </button>
          <button className="p-2.5 rounded-full border border-[#E7DFD4] bg-white text-[#2A1E1B] hover:bg-[#F6F0E6] transition-colors">
            <Search size={16} />
          </button>
          <button className="relative p-2.5 rounded-full border border-[#E7DFD4] bg-white text-[#2A1E1B] hover:bg-[#F6F0E6] transition-colors">
            <Bell size={16} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#C5A059] rounded-full ring-2 ring-white"></span>
          </button>
        </div>)}

        </div>
      </header>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        
        {/* Card 1: Total Sales */}
        <div className="bg-[#B58D54] text-white p-6 rounded-2xl shadow-sm border border-[#9E7B3B] flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm bg-black/20 px-2 py-0.5 rounded-md">₱</span>
              <span className="text-xs font-bold uppercase tracking-wider text-white/90">Total Sales</span>
            </div>
            <span className="text-[10px] text-white/80 font-mono">{selectedDate}</span>
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight">{kpiData.totalSales}</div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-100 mt-1 font-medium">
              <TrendingUp size={12} />
              <span>{kpiData.totalSalesGrowth}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Cash Payments */}
        <div className="bg-[#F8F5F0] p-6 rounded-2xl border border-[#E7DFD4] shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white text-[#C5A059] rounded-lg border border-[#E7DFD4]">
                <DollarSign size={16} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Cash Payments</span>
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#2A1E1B]">₱{totalCashSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <p className="text-[11px] text-[#8A8174] mt-1 font-medium">
              {kpiData.cashShare}
            </p>
          </div>
        </div>

        {/* Card 3: Digital Payments */}
        <div className="bg-[#F8F5F0] p-6 rounded-2xl border border-[#E7DFD4] shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white text-[#C5A059] rounded-lg border border-[#E7DFD4]">
                <CreditCard size={16} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Digital Payments</span>
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#2A1E1B]">₱{totalDigitalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <p className="text-[11px] text-[#8A8174] mt-1 font-medium">
              {kpiData.digitalMethods}
            </p>
          </div>
        </div>

        {/* Card 4: Voided/Refunds */}
        <div className="bg-[#F8F5F0] p-6 rounded-2xl border border-[#E7DFD4] shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white text-rose-600 rounded-lg border border-[#E7DFD4]">
                <Clock size={16} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Voided/Refunds</span>
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-rose-700">{kpiData.voidedRefunds}</div>
            <p className="text-[11px] text-rose-600 mt-1 font-medium">
              {kpiData.voidedCount}
            </p>
          </div>
        </div>

      </div>

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Section: Transaction History Table */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E7DFD4] shadow-sm overflow-hidden">
          
          <div className="p-5 border-b border-[#E7DFD4] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FDFBF7]">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#2A1E1B]">Transaction History</h2>
                <span className="bg-[#F8F5F0] text-[#B58D54] border border-[#E7DFD4] text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {filteredTransactions.length} total
                </span>
              </div>
              <p className="text-xs text-[#8A8174] mt-0.5">Real-time point of sale transactions list</p>
            </div>

            <button 
              onClick={() => setIsReportsListModalOpen(true)}
              className="bg-[#2A1E1B] hover:bg-[#C5A059] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <FileText size={14} className="text-[#C5A059]" />
              <span>Closeout Reports</span>
            </button>
          </div>

          {/* Filter Pills */}
          <div className="p-4 bg-[#F8F5F0] border-b border-[#E7DFD4] flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeFilter === 'ALL' 
                  ? 'bg-[#2A1E1B] text-white shadow-xs' 
                  : 'bg-white text-gray-600 hover:bg-[#E7DFD4] hover:text-[#2A1E1B] border border-[#E7DFD4]'
              }`}
            >
              All Services
            </button>
            <button
              onClick={() => setActiveFilter('CASH')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeFilter === 'CASH' 
                  ? 'bg-[#2A1E1B] text-white shadow-xs' 
                  : 'bg-white text-gray-600 hover:bg-[#E7DFD4] hover:text-[#2A1E1B] border border-[#E7DFD4]'
              }`}
            >
              Cash
            </button>
            <button
              onClick={() => setActiveFilter('DIGITAL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeFilter === 'DIGITAL' 
                  ? 'bg-[#2A1E1B] text-white shadow-xs' 
                  : 'bg-white text-gray-600 hover:bg-[#E7DFD4] hover:text-[#2A1E1B] border border-[#E7DFD4]'
              }`}
            >
              Digital
            </button>
            <button
              onClick={() => setActiveFilter('VOIDED')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeFilter === 'VOIDED' 
                  ? 'bg-[#2A1E1B] text-white shadow-xs' 
                  : 'bg-white text-gray-600 hover:bg-[#E7DFD4] hover:text-[#2A1E1B] border border-[#E7DFD4]'
              }`}
            >
              Voided / Refunded
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8F5F0] text-[10px] uppercase font-bold text-gray-500 tracking-wider border-b border-[#E7DFD4]">
                  <th className="p-4 pl-6">Txn ID</th>
                  <th className="p-4">Time</th>
                  <th className="p-4">Cashier</th>
                  <th className="p-4">Service / Item</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4 pr-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7DFD4]/60 text-xs">
                {filteredTransactions.map((t) => (
                  <tr key={t.txnId} className="hover:bg-[#FDFBF7] transition-colors">
                    <td className="p-4 pl-6 font-mono font-bold text-[#2A1E1B]">{t.txnId}</td>
                    <td className="p-4 font-mono text-gray-500">{t.time}</td>
                    <td className="p-4 text-gray-600 font-medium">{t.cashier}</td>
                    <td className="p-4 font-bold text-[#2A1E1B] truncate max-w-[160px]">{t.service}</td>
                    <td className="p-4 text-gray-600">{t.method}</td>
                    <td className="p-4 font-bold text-[#2A1E1B]">₱{t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="p-4 pr-6 text-right">{renderStatusBadge(t.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* Right Section: End of Day Closeout Card */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E7DFD4] shadow-sm p-6 space-y-5">
          
          <div className="border-b border-[#E7DFD4] pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#2A1E1B]">End of Day Closeout</h2>
              <p className="text-xs text-[#8A8174]">Shift reconciliation report</p>
            </div>
            {isRegisterClosed && (
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                CLOSED
              </span>
            )}
          </div>

          {/* Structured Details Box */}
          <div className="bg-[#F8F5F0] border border-[#E7DFD4] p-4 rounded-xl space-y-3 text-xs">
            
            <div className="flex justify-between items-center text-gray-600">
              <span>Register</span>
              <strong className="text-[#2A1E1B]">Register 1</strong>
            </div>

            <div className="flex justify-between items-center text-gray-600">
              <span>Cashier on duty</span>
              <strong className="text-[#2A1E1B]">Aljean Mark A. Angeles</strong>
            </div>

            <div className="flex justify-between items-center text-gray-600 pb-2 border-b border-dashed border-[#E7DFD4]">
              <span>Shift</span>
              <strong className="text-[#2A1E1B]">8:00 AM – 8:00 PM</strong>
            </div>

            <div className="flex justify-between items-center text-gray-600">
              <span>Opening Cash</span>
              <span className="font-bold text-[#2A1E1B]">₱{openingCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-between items-center text-gray-600">
              <span>Total Cash Sales</span>
              <span className="font-bold text-[#2A1E1B]">₱{totalCashSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-between items-center text-gray-600">
              <span>Total Digital Sales</span>
              <span className="font-bold text-[#2A1E1B]">₱{totalDigitalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-between items-center text-gray-600 pb-3 border-b border-dashed border-[#E7DFD4]">
              <span>Voided / Refunded</span>
              <span className="font-bold text-rose-600">₱800.00 / ₱400.00</span>
            </div>

            <div className="flex justify-between items-center pt-1 text-sm font-bold text-[#2A1E1B]">
              <span>Expected Cash Drawer</span>
              <span>₱{expectedCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>

            {/* Input Count Field */}
            <div className="pt-2 space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174]">
                Actual Physical Cash Count
              </label>
              <input
                type="text"
                disabled={isRegisterClosed}
                placeholder="Enter counted cash amount..."
                value={actualCashCount}
                onChange={(e) => setActualCashCount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DFD4] bg-white text-xs font-bold text-[#2A1E1B] outline-none focus:border-[#C5A059] transition-all disabled:opacity-60"
              />
            </div>

            <div className="flex justify-between items-center pt-2 text-xs font-bold">
              <span className="text-[#8A8174]">Discrepancy / Over-Short</span>
              <span className={discrepancy < 0 ? 'text-rose-600' : discrepancy > 0 ? 'text-emerald-600' : 'text-emerald-700'}>
                ₱{discrepancy.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={() => {
                if (!actualCashCount) {
                  showToast('Please enter physical cash count before closeout.');
                  return;
                }
                setIsCloseoutModalOpen(true);
              }}
              disabled={isRegisterClosed}
              className="w-full py-3 rounded-xl bg-[#2A1E1B] hover:bg-[#C5A059] text-white font-bold text-xs tracking-wider uppercase transition-all shadow-sm disabled:opacity-50"
            >
              {isRegisterClosed ? 'Register Closed For Day' : 'Submit & Close Register'}
            </button>

            <button
              onClick={() => {
                setSelectedReportForInvoice({ date: selectedDate, totalSales: 24850.00 });
                setIsInvoiceModalOpen(true);
              }}
              className="w-full py-2.5 rounded-xl border border-[#E7DFD4] bg-white hover:bg-[#F8F5F0] text-[#2A1E1B] font-bold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Printer size={14} />
              <span>Print A4 Invoice Summary</span>
            </button>
          </div>

        </div>

      </div>

      {/* ================= MODAL: EXPORT CSV CONFIRMATION ================= */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E7DFD4] shadow-2xl max-w-md w-full p-6 space-y-5 text-[#2A1E1B]">
            <div className="flex items-center justify-between border-b border-[#E7DFD4] pb-3">
              <div className="flex items-center gap-2">
                <Download className="text-[#C5A059] h-5 w-5" />
                <h3 className="font-bold text-base">Confirm CSV Export</h3>
              </div>
              <button onClick={() => setIsExportModalOpen(false)} className="text-gray-400 hover:text-black">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to download the point of sale transaction logs spreadsheet for <strong className="text-[#2A1E1B]">{selectedDate}</strong>?
            </p>

            <div className="bg-[#F8F5F0] p-4 rounded-2xl border border-[#E7DFD4] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Report Date:</span>
                <span className="font-bold">{selectedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Included Records:</span>
                <span className="font-bold">{transactions.length} Transactions</span>
              </div>
              <div className="flex justify-between border-t border-[#E7DFD4] pt-2 font-bold">
                <span>File Format:</span>
                <span className="text-[#C5A059]">Comma-Separated Values (.csv)</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-[#E7DFD4] text-xs font-bold text-gray-600 hover:bg-[#F8F5F0]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmExportCSV}
                className="px-5 py-2.5 rounded-xl bg-[#2A1E1B] text-white text-xs font-bold hover:bg-[#C5A059] shadow-md transition-all flex items-center gap-2"
              >
                <Download size={14} />
                <span>Export & Download</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CLOSEOUT REPORTS SELECTION LIST ================= */}
      {isReportsListModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#F9F8EF] rounded-[28px] border-2 border-[#B3A772] shadow-2xl max-w-2xl w-full overflow-hidden text-[#443523]">
            
            {/* Modal Header */}
            <div className="p-6 sm:p-8 pb-4 flex items-start justify-between">
              <div>
                <p className="text-[11px] text-[#8A8174]">Closeout reports</p>
                <h2 className="text-2xl font-bold text-[#4A3B2C] mt-0.5">Closeout Reports</h2>
                <p className="text-xs text-[#8A8174] mt-0.5">Daily Closeout Reports</p>
              </div>
              <button 
                onClick={() => setIsReportsListModalOpen(false)}
                className="text-[#8A8174] hover:text-[#2A1E1B] p-1 transition-colors"
              >
                <X size={22} />
              </button>
            </div>

            {/* Filter Search Input */}
            <div className="px-6 sm:px-8 pb-4">
              <div className="inline-flex items-center gap-2 bg-white border border-[#E0D8C3] rounded-xl px-3.5 py-2 text-xs text-[#443523] w-48 shadow-2xs">
                <SlidersHorizontal size={14} className="text-[#8A8174]" />
                <input 
                  type="text" 
                  placeholder="Filter"
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="bg-transparent outline-none w-full text-xs font-semibold placeholder:text-[#8A8174]"
                />
              </div>
            </div>

            {/* Daily Closeout Reports Rows */}
            <div className="px-6 sm:px-8 space-y-3 max-h-[320px] overflow-y-auto mb-8">
              {filteredReportsList.map((report) => (
                <div 
                  key={report.id}
                  className="bg-white rounded-2xl border border-[#B3A772]/60 p-4 sm:px-6 flex items-center justify-between shadow-2xs hover:border-[#B3A772] transition-all"
                >
                  <span className="text-base font-bold text-[#2A1E1B]">{report.date}</span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteReport(report.id, report.date)}
                      className="px-4 py-2 rounded-xl border border-[#A29883] text-[#5C5243] hover:bg-[#F6F4EF] text-xs font-bold transition-all"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => handleViewReportInvoice(report)}
                      className="px-5 py-2 rounded-xl bg-[#675B4B] hover:bg-[#4A3F32] text-white text-xs font-bold transition-all shadow-2xs"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
              
              {filteredReportsList.length === 0 && (
                <div className="text-center py-8 text-xs text-[#8A8174]">
                  No closeout reports found for this filter.
                </div>
              )}
            </div>

            {/* Footer Color Bar */}
            <div className="h-12 bg-[#B8A97A] w-full" />

          </div>
        </div>
      )}

      {/* ================= MODAL: SUBMIT & CLOSE REGISTER CONFIRMATION ================= */}
      {isCloseoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E7DFD4] shadow-2xl max-w-md w-full p-6 space-y-5 text-[#2A1E1B]">
            <div className="flex items-center justify-between border-b border-[#E7DFD4] pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-amber-600 h-5 w-5" />
                <h3 className="font-bold text-base">Confirm Register Closeout</h3>
              </div>
              <button onClick={() => setIsCloseoutModalOpen(false)} className="text-gray-400 hover:text-black">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to lock and submit the End of Day shift reconciliation for <strong className="text-[#2A1E1B]">{selectedDate}</strong>?
            </p>

            <div className="bg-[#F8F5F0] p-4 rounded-2xl border border-[#E7DFD4] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Expected Cash:</span>
                <span className="font-bold">₱{expectedCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Actual Counted:</span>
                <span className="font-bold">₱{actualCashNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between border-t border-[#E7DFD4] pt-2 font-bold">
                <span>Net Variance:</span>
                <span className={discrepancy < 0 ? 'text-rose-600' : 'text-emerald-700'}>
                  ₱{discrepancy.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsCloseoutModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-[#E7DFD4] text-xs font-bold text-gray-600 hover:bg-[#F8F5F0]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCloseout}
                className="px-5 py-2.5 rounded-xl bg-[#2A1E1B] text-white text-xs font-bold hover:bg-[#C5A059] shadow-md transition-all"
              >
                Confirm Closeout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: A4 NON-TAX OFFICIAL INVOICE SUMMARY ================= */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#E7DFD4] shadow-2xl max-w-3xl w-full p-8 my-8 text-[#2A1E1B] space-y-6">
            
            {/* Header Control Buttons */}
            <div className="flex items-center justify-between border-b border-[#E7DFD4] pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="text-[#C5A059] h-5 w-5" />
                <h3 className="font-bold text-base">A4 Non-Tax Invoice Closeout Document</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    window.print();
                    showToast('Sending A4 Invoice Summary to printer...');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#2A1E1B] text-white hover:bg-[#C5A059] text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                >
                  <Printer size={14} />
                  <span>Print Invoice</span>
                </button>
                <button onClick={() => setIsInvoiceModalOpen(false)} className="text-gray-400 hover:text-black p-1">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* A4 Document Area */}
            <div className="bg-[#FFFDF8] border border-[#E7DFD4] p-8 rounded-xl shadow-xs space-y-6 text-xs font-sans">
              
              {/* Invoice Brand Header */}
              <div className="flex justify-between items-start border-b-2 border-[#2A1E1B] pb-6">
                <div>
                  <h1 className="text-2xl font-serif font-bold text-[#2A1E1B] tracking-wide">CENTY'ZZ SALON</h1>
                  <p className="text-[10px] uppercase tracking-widest text-[#C5A059] font-bold">Hair & Beauty Studio</p>
                  <p className="text-[11px] text-[#8A8174] mt-1">123 Salon Avenue, Metro Manila</p>
                  <p className="text-[11px] text-[#8A8174]">Contact: +63 995 234 7123</p>
                </div>

                <div className="text-right">
                  <span className="bg-[#F8F5F0] text-[#2A1E1B] border border-[#E7DFD4] text-xs font-bold px-3 py-1 rounded-md uppercase">
                    OFFICIAL INVOICE
                  </span>
                  <p className="text-[11px] font-bold text-[#2A1E1B] mt-2">Invoice No: <span className="font-mono">INV-2026-0820</span></p>
                  <p className="text-[11px] text-[#8A8174]">Issue Date: {selectedReportForInvoice ? selectedReportForInvoice.date : selectedDate}</p>
                  <p className="text-[10px] text-rose-700 font-bold mt-1 uppercase">*** NON-TAX STATEMENT ***</p>
                </div>
              </div>

              {/* Shift Information Grid */}
              <div className="grid grid-cols-3 gap-4 bg-[#F8F5F0] p-4 rounded-xl border border-[#E7DFD4]">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Register ID</p>
                  <p className="font-bold text-[#2A1E1B] mt-0.5">REGISTER 01</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Cashier On Duty</p>
                  <p className="font-bold text-[#2A1E1B] mt-0.5">{selectedReportForInvoice?.cashier || 'Aljean Mark A. Angeles'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Shift Hours</p>
                  <p className="font-bold text-[#2A1E1B] mt-0.5">08:00 AM – 08:00 PM</p>
                </div>
              </div>

              {/* Sales Breakdown Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#2A1E1B]">Revenue & Settlement Summary</h4>
                <table className="w-full border-collapse border border-[#E7DFD4] text-xs">
                  <thead>
                    <tr className="bg-[#2A1E1B] text-white text-[10px] uppercase font-bold">
                      <th className="p-2.5 text-left">Category / Description</th>
                      <th className="p-2.5 text-center">Payment Method</th>
                      <th className="p-2.5 text-right">Amount (PHP)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7DFD4]">
                    <tr>
                      <td className="p-2.5 font-bold">Cash Drawer Opening Float</td>
                      <td className="p-2.5 text-center">Cash Float</td>
                      <td className="p-2.5 text-right font-mono">₱{openingCash.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">Total Cash Receipts</td>
                      <td className="p-2.5 text-center">Physical Cash</td>
                      <td className="p-2.5 text-right font-mono">₱{totalCashSales.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">Digital Sales (GCash / Maya / Cards)</td>
                      <td className="p-2.5 text-center">Digital E-Wallet</td>
                      <td className="p-2.5 text-right font-mono">₱{totalDigitalSales.toFixed(2)}</td>
                    </tr>
                    <tr className="bg-[#F8F5F0]">
                      <td className="p-2.5 font-bold text-rose-700">Less: Voided / Refunded Transactions</td>
                      <td className="p-2.5 text-center text-rose-700">Reversals</td>
                      <td className="p-2.5 text-right font-mono font-bold text-rose-700">-₱1,200.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Cash Reconciliation Calculation */}
              <div className="flex justify-end pt-2">
                <div className="w-72 space-y-2 border border-[#E7DFD4] bg-[#F8F5F0] p-4 rounded-xl text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expected Cash Drawer:</span>
                    <span className="font-bold">₱{expectedCash.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Actual Counted Cash:</span>
                    <span className="font-bold">₱{actualCashNum.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#E7DFD4] pt-2 font-bold text-sm">
                    <span>Discrepancy:</span>
                    <span className={discrepancy < 0 ? 'text-rose-600' : 'text-emerald-700'}>
                      ₱{discrepancy.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatures & Disclaimers */}
              <div className="pt-8 border-t border-[#E7DFD4] space-y-6">
                <div className="grid grid-cols-2 gap-12 text-center text-xs">
                  <div>
                    <div className="border-b border-[#2A1E1B] pb-1 font-bold text-[#2A1E1B]">Aljean Mark A. Angeles</div>
                    <p className="text-[10px] text-gray-500 mt-1">Cashier Signature & Date</p>
                  </div>
                  <div>
                    <div className="border-b border-[#2A1E1B] pb-1 font-bold text-[#2A1E1B]">Millicent Campillos</div>
                    <p className="text-[10px] text-gray-500 mt-1">Manager / Owner Approval</p>
                  </div>
                </div>

                <div className="text-[9px] text-gray-400 text-center leading-relaxed">
                  Notice: This document serves solely as an internal Non-Tax Invoice Summary for daily POS shift reconciliation purposes.
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}