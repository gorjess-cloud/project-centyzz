import HeaderActions from '../../components/workspace/HeaderActions';
import { useState, useEffect, useCallback } from 'react';
import ConfirmationModal from '../../components/ConfirmationModal';
import { 
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
  SlidersHorizontal,
  FileQuestion
} from 'lucide-react';

export default function POSReportsView({ currentUser, showHeaderActions = true }) {
  const [selectedDate, setSelectedDate] = useState('August 20, 2026');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [actualCashCount, setActualCashCount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // API Data States
  const [kpiData, setKpiData] = useState({
    totalSales: '₱0.00',
    totalSalesGrowth: 'N/A',
    cashPayments: '₱0.00',
    cashShare: '0% of total',
    digitalPayments: '₱0.00',
    digitalMethods: 'GCash, Maya, Card',
    voidedRefunds: '₱0.00',
    voidedCount: '0 transactions'
  });
  const [transactions, setTransactions] = useState([]);
  const [closeoutInfo, setCloseoutInfo] = useState({
    register: 'Register 1',
    cashier: 'Aljean Mark A. Angeles',
    shift: '8:00 AM – 8:00 PM',
    openingCash: 5000,
    totalCashSales: 0,
    totalDigitalSales: 0,
    voidedRefunded: '₱0.00 / ₱0.00',
    expectedCash: 5000,
    actualCashCount: 0,
    discrepancy: 0,
    isClosed: false
  });

  // Modals & Notifications
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isCloseoutModalOpen, setIsCloseoutModalOpen] = useState(false);
  const [isReportsListModalOpen, setIsReportsListModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [savedCloseoutReports, setSavedCloseoutReports] = useState([]);
  const [toastMessage, setToastMessage] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [selectedReportForInvoice, setSelectedReportForInvoice] = useState(null);
  const [pendingDeleteReport, setPendingDeleteReport] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const getAuthHeaders = useCallback(() => {
    const token = currentUser?.accessToken || localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }, [currentUser]);

  const fetchPosData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/pos?date=${encodeURIComponent(selectedDate)}`, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setKpiData(data.kpiData);
        setTransactions(data.transactions);
        setCloseoutInfo(data.closeoutInfo);
        if (data.closeoutInfo.actualCashCount != null && data.closeoutInfo.isClosed) {
          setActualCashCount(String(data.closeoutInfo.actualCashCount));
        } else {
          setActualCashCount('');
        }
        setLoadError('');
      } else {
        throw new Error(`Unable to load POS report (HTTP ${res.status}).`);
      }
    } catch (err) {
      setLoadError(err.message || 'Unable to load POS report.');
      console.error('Error fetching POS report:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, getAuthHeaders]);

  const fetchCloseoutReports = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/reports/closeouts', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setSavedCloseoutReports(data);
      }
    } catch (err) {
      console.error('Error fetching closeout reports list:', err);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    let isSubscribed = true;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/reports/pos?date=${encodeURIComponent(selectedDate)}`, {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
        });
        if (res.ok && isSubscribed) {
          setLoadError('');
          const data = await res.json();
          setKpiData(data.kpiData);
          setTransactions(data.transactions);
          setCloseoutInfo(data.closeoutInfo);
          if (data.closeoutInfo.actualCashCount != null && data.closeoutInfo.isClosed) {
            setActualCashCount(String(data.closeoutInfo.actualCashCount));
          } else {
            setActualCashCount('');
          }
        }
      } catch (err) {
        if (isSubscribed) {
          setLoadError('Unable to connect to backend service.');
          console.error('Error fetching POS report:', err);
        }
      } finally {
        if (isSubscribed) setIsLoading(false);
      }

      try {
        const resCloseout = await fetch('/api/admin/reports/closeouts', {
          headers: getAuthHeaders(),
        });
        if (resCloseout.ok && isSubscribed) {
          const dataCloseout = await resCloseout.json();
          setSavedCloseoutReports(dataCloseout);
        }
      } catch (err) {
        console.error('Error fetching closeout reports list:', err);
      }
    };

    loadData();

    return () => {
      isSubscribed = false;
    };
  }, [selectedDate, currentUser, getAuthHeaders]);

  const openingCash = closeoutInfo.openingCash;
  const totalCashSales = closeoutInfo.totalCashSales;
  const totalDigitalSales = closeoutInfo.totalDigitalSales;
  const expectedCash = closeoutInfo.expectedCash;

  const actualCashNum = parseFloat(actualCashCount.replace(/[^0-9.]/g, '')) || 0;
  const discrepancy = actualCashCount !== '' ? actualCashNum - expectedCash : closeoutInfo.discrepancy;

  const handleConfirmExportCSV = () => {
    const BOM = '\uFEFF';
    const companyHeader = [
      `CENTY'ZZ SALON - POINT OF SALE TRANSACTION REPORT`,
      `Report Date: "${selectedDate}"`,
      `Generated On: "${new Date().toLocaleString()}"`,
      `Generated By: "${closeoutInfo.cashier || 'Aljean Mark A. Angeles'}"`,
      ``,
    ].join('\n');

    const summaryHeader = [
      `--- EXECUTIVE FINANCIAL SUMMARY ---`,
      `Total Sales Revenue,"PHP ${kpiData.totalSales || '₱0.00'}"`,
      `Total Cash Receipts,"PHP ${kpiData.cashPayments || '₱0.00'}"`,
      `Total Digital Payments,"PHP ${kpiData.digitalPayments || '₱0.00'}"`,
      `Voided / Refunded Total,"PHP ${kpiData.voidedRefunds || '₱0.00'}"`,
      ``,
    ].join('\n');

    const tableHeader = `--- TRANSACTION LOGS ---\nTxn ID,Time,Cashier,Service / Item,Payment Method,Amount (PHP),Status\n`;

    const tableRows = transactions.length > 0 
      ? transactions.map((t) => {
          const safeService = `"${(t.service || '').replace(/"/g, '""')}"`;
          const formattedAmount = `"PHP ${Number(t.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}"`;
          return `${t.txnId},${t.time},${t.cashier},${safeService},${t.method},${formattedAmount},${t.status}`;
        }).join('\n')
      : 'No transactions recorded on this day.';

    const csvContent = BOM + companyHeader + summaryHeader + tableHeader + tableRows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Centyzz_POS_Report_${selectedDate.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    setIsExportModalOpen(false);
    showToast(`Successfully downloaded POS Report CSV for ${selectedDate}`);
  };

  const handleConfirmCloseout = async () => {
    try {
      const res = await fetch('/api/admin/reports/closeout', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportDate: selectedDate, actualCash: actualCashNum }),
      });

      if (res.ok) {
        setIsCloseoutModalOpen(false);
        showToast(`Register closed successfully for ${selectedDate}`);
        fetchPosData();
        fetchCloseoutReports();
      }
    } catch (err) {
      console.error('Error submitting closeout:', err);
    }
  };

  const handleDeleteReport = async (id, reportDate) => {
    try {
      const res = await fetch(`/api/admin/reports/closeout/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        showToast(`Deleted closeout report for ${reportDate}`);
        fetchCloseoutReports();
        fetchPosData();
      }
    } catch (err) {
      console.error('Error deleting report:', err);
    }
  };

const handleViewReportInvoice = async (report) => {
    try {
      const res = await fetch(`/api/admin/reports/pos?date=${encodeURIComponent(report.date)}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        
        const rawTxns = data.transactions || [];
        const cashSales = Number(data.closeoutInfo?.totalCashSales || 0);
        const digitalSales = Number(data.closeoutInfo?.totalDigitalSales || 0);
        const totalRevenue = cashSales + digitalSales;

        // STRICT CHECK: Must have actual transactions OR non-zero total revenue
        const hasRealData = rawTxns.length > 0 || totalRevenue > 0;

        setSelectedReportForInvoice({
          date: report.date,
          cashier: report.cashier || data.closeoutInfo?.cashier || 'Aljean Mark A. Angeles',
          register: data.closeoutInfo?.register || 'Register 1',
          shift: data.closeoutInfo?.shift || '8:00 AM – 8:00 PM',
          openingCash: Number(data.closeoutInfo?.openingCash || 0),
          totalCashSales: cashSales,
          totalDigitalSales: digitalSales,
          voidedRefundsTotal: Number(data.kpiData?.voidedRefunds?.replace(/[^0-9.]/g, '') || 0),
          expectedCash: Number(data.closeoutInfo?.expectedCash || 0),
          actualCashCount: Number(data.closeoutInfo?.actualCashCount || 0),
          discrepancy: Number(data.closeoutInfo?.discrepancy || 0),
          hasTransactions: hasRealData, // <--- This now forces false when sales are 0!
        });
        setIsReportsListModalOpen(false);
        setIsInvoiceModalOpen(true);
      }
    } catch (err) {
      console.error('Error fetching report details for invoice:', err);
    }
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
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-[#3A342B] text-[#F5F1EA] px-4 py-3 rounded-xl shadow-xl border border-[#C5A059]/40 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-[#C5A059]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with Date Dropdown */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-[#2A1E1B] truncate">POS Reports</h1>
          {loadError && <p role="alert" className="mt-1 text-xs text-rose-700 font-semibold">{loadError}</p>}
          <p className="mt-0.5 text-xs text-[#8A8174] truncate">
            Analyze daily revenue, drawer closeouts, and transaction history
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 border-r border-[#E7DFD4] pr-3">
            <div className="relative">
              <input
                type="date"
                aria-label="POS report date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-[#F8F5F0] hover:bg-[#E7DFD4] border border-[#E7DFD4] text-[#2A1E1B] font-bold text-xs px-3.5 py-2 rounded-xl outline-none cursor-pointer transition-colors shadow-2xs"
              />
            </div>

            <button 
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E7DFD4] bg-white text-[#2A1E1B] hover:bg-[#F6F0E6] text-xs font-bold transition-colors shadow-2xs"
            >
              <Download size={14} className="text-[#C5A059]" />
              <span>Export CSV</span>
            </button>
          </div>

          {showHeaderActions && (<HeaderActions />)}
        </div>
      </header>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
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
            <div className="text-3xl font-bold text-[#2A1E1B]">{kpiData.cashPayments}</div>
            <p className="text-[11px] text-[#8A8174] mt-1 font-medium">{kpiData.cashShare}</p>
          </div>
        </div>

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
            <div className="text-3xl font-bold text-[#2A1E1B]">{kpiData.digitalPayments}</div>
            <p className="text-[11px] text-[#8A8174] mt-1 font-medium">{kpiData.digitalMethods}</p>
          </div>
        </div>

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
            <p className="text-[11px] text-rose-600 mt-1 font-medium">{kpiData.voidedCount}</p>
          </div>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
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

          <div className="p-4 bg-[#F8F5F0] border-b border-[#E7DFD4] flex items-center gap-2 overflow-x-auto">
            {['ALL', 'CASH', 'DIGITAL', 'VOIDED'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeFilter === filter 
                    ? 'bg-[#2A1E1B] text-white shadow-xs' 
                    : 'bg-white text-gray-600 hover:bg-[#E7DFD4] hover:text-[#2A1E1B] border border-[#E7DFD4]'
                }`}
              >
                {filter === 'ALL' ? 'All Services' : filter === 'CASH' ? 'Cash' : filter === 'DIGITAL' ? 'Digital' : 'Voided / Refunded'}
              </button>
            ))}
          </div>

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
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-[#8A8174]">Loading transactions from Neon DB...</td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-12 text-center text-[#8A8174]">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <FileQuestion size={32} className="text-[#C5A059]/60" />
                        <span className="font-bold text-sm text-[#2A1E1B]">No transactions made on this day.</span>
                        <span className="text-xs text-[#8A8174]">There were no registered POS sales for {selectedDate}.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((t) => (
                    <tr key={t.txnId} className="hover:bg-[#FDFBF7] transition-colors">
                      <td className="p-4 pl-6 font-mono font-bold text-[#2A1E1B]">{t.txnId}</td>
                      <td className="p-4 font-mono text-gray-500">{t.time}</td>
                      <td className="p-4 text-gray-600 font-medium">{t.cashier}</td>
                      <td className="p-4 font-bold text-[#2A1E1B] truncate max-w-40">{t.service}</td>
                      <td className="p-4 text-gray-600">{t.method}</td>
                      <td className="p-4 font-bold text-[#2A1E1B]">₱{t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="p-4 pr-6 text-right">{renderStatusBadge(t.status)}</td>
                    </tr>
                  ))
                )}
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
            {closeoutInfo.isClosed ? (
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                CLOSED
              </span>
            ) : (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-200">
                OPEN SHIFT
              </span>
            )}
          </div>

          <div className="bg-[#F8F5F0] border border-[#E7DFD4] p-4 rounded-xl space-y-3 text-xs">
            <div className="flex justify-between items-center text-gray-600">
              <span>Register</span>
              <strong className="text-[#2A1E1B]">{closeoutInfo.register}</strong>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span>Cashier on duty</span>
              <strong className="text-[#2A1E1B]">{closeoutInfo.cashier}</strong>
            </div>
            <div className="flex justify-between items-center text-gray-600 pb-2 border-b border-dashed border-[#E7DFD4]">
              <span>Shift</span>
              <strong className="text-[#2A1E1B]">{closeoutInfo.shift}</strong>
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
              <span className="font-bold text-rose-600">{closeoutInfo.voidedRefunded}</span>
            </div>
            <div className="flex justify-between items-center pt-1 text-sm font-bold text-[#2A1E1B]">
              <span>Expected Cash Drawer</span>
              <span>₱{expectedCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="pt-2 space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174]">
                Actual Physical Cash Count
              </label>
              <input
                type="text"
                disabled={closeoutInfo.isClosed}
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

          <div className="space-y-2 pt-1">
            <button
              onClick={() => {
                if (!actualCashCount) {
                  showToast('Please enter physical cash count before closeout.');
                  return;
                }
                setIsCloseoutModalOpen(true);
              }}
              disabled={closeoutInfo.isClosed}
              className="w-full py-3 rounded-xl bg-[#2A1E1B] hover:bg-[#C5A059] text-white font-bold text-xs tracking-wider uppercase transition-all shadow-sm disabled:opacity-50"
            >
              {closeoutInfo.isClosed ? 'Register Closed For Day' : 'Submit & Close Register'}
            </button>

            <button
              onClick={() => {
                setSelectedReportForInvoice({
                  date: selectedDate,
                  cashier: closeoutInfo.cashier || 'Aljean Mark A. Angeles',
                  register: closeoutInfo.register || 'Register 1',
                  shift: closeoutInfo.shift || '8:00 AM – 8:00 PM',
                  openingCash: Number(closeoutInfo.openingCash || 5000),
                  totalCashSales: Number(closeoutInfo.totalCashSales || 0),
                  totalDigitalSales: Number(closeoutInfo.totalDigitalSales || 0),
                  voidedRefundsTotal: Number(kpiData?.voidedRefunds?.replace(/[^0-9.]/g, '') || 0),
                  expectedCash: Number(closeoutInfo.expectedCash || 5000),
                  actualCashCount: actualCashNum || Number(closeoutInfo.actualCashCount || 0),
                  discrepancy: discrepancy,
                  hasTransactions: transactions.length > 0 || !!closeoutInfo.isClosed,
                });
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

      {/* Modals */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
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
              Are you sure you want to download transaction logs for <strong className="text-[#2A1E1B]">{selectedDate}</strong>?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={() => setIsExportModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-[#E7DFD4] text-xs font-bold text-gray-600 hover:bg-[#F8F5F0]">Cancel</button>
              <button onClick={handleConfirmExportCSV} className="px-5 py-2.5 rounded-xl bg-[#2A1E1B] text-white text-xs font-bold hover:bg-[#C5A059] shadow-md transition-all flex items-center gap-2">
                <Download size={14} />
                <span>Export & Download</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {isReportsListModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#F9F8EF] rounded-[28px] border-2 border-[#B3A772] shadow-2xl max-w-2xl w-full overflow-hidden text-[#443523]">
            <div className="p-6 sm:p-8 pb-4 flex items-start justify-between">
              <div>
                <p className="text-[11px] text-[#8A8174]">Closeout reports</p>
                <h2 className="text-2xl font-bold text-[#443B2C] mt-0.5">Closeout Reports</h2>
              </div>
              <button onClick={() => setIsReportsListModalOpen(false)} className="text-[#8A8174] hover:text-[#2A1E1B] p-1"><X size={22} /></button>
            </div>

            <div className="px-6 sm:px-8 pb-4">
              <div className="inline-flex items-center gap-2 bg-white border border-[#E0D8C3] rounded-xl px-3.5 py-2 text-xs text-[#443523] w-48 shadow-2xs">
                <SlidersHorizontal size={14} className="text-[#8A8174]" />
                <input 
                  type="text" 
                  placeholder="Filter date..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="bg-transparent outline-none w-full text-xs font-semibold placeholder:text-[#8A8174]"
                />
              </div>
            </div>

            <div className="px-6 sm:px-8 space-y-3 max-h-80 overflow-y-auto mb-8">
              {filteredReportsList.map((report) => (
                <div key={report.id} className="bg-white rounded-2xl border border-[#B3A772]/60 p-4 sm:px-6 flex items-center justify-between shadow-2xs">
                  <span className="text-base font-bold text-[#2A1E1B]">{report.date}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPendingDeleteReport(report)} className="px-4 py-2 rounded-xl border border-[#A29883] text-[#5C5243] hover:bg-[#F6F4EF] text-xs font-bold">Delete</button>
                    <button onClick={() => handleViewReportInvoice(report)} className="px-5 py-2 rounded-xl bg-[#675B4B] hover:bg-[#4A3F32] text-white text-xs font-bold shadow-2xs">View</button>
                  </div>
                </div>
              ))}
              {filteredReportsList.length === 0 && <div className="text-center py-8 text-xs text-[#8A8174]">No closeout reports found.</div>}
            </div>
            <div className="h-12 bg-[#B8A97A] w-full" />
          </div>
        </div>
      )}

      {isCloseoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E7DFD4] shadow-2xl max-w-md w-full p-6 space-y-5 text-[#2A1E1B]">
            <div className="flex items-center justify-between border-b border-[#E7DFD4] pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-amber-600 h-5 w-5" />
                <h3 className="font-bold text-base">Confirm Register Closeout</h3>
              </div>
              <button onClick={() => setIsCloseoutModalOpen(false)} className="text-gray-400 hover:text-black"><X size={18} /></button>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to lock and submit the End of Day shift reconciliation for <strong className="text-[#2A1E1B]">{selectedDate}</strong>?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={() => setIsCloseoutModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-[#E7DFD4] text-xs font-bold text-gray-600 hover:bg-[#F8F5F0]">Cancel</button>
              <button onClick={handleConfirmCloseout} className="px-5 py-2.5 rounded-xl bg-[#2A1E1B] text-white text-xs font-bold hover:bg-[#C5A059] shadow-md">Confirm Closeout</button>
            </div>
          </div>
        </div>
      )}

      {isInvoiceModalOpen && selectedReportForInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#E7DFD4] shadow-2xl max-w-3xl w-full p-8 my-8 text-[#2A1E1B] space-y-6">
            <div className="flex items-center justify-between border-b border-[#E7DFD4] pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="text-[#C5A059] h-5 w-5" />
                <h3 className="font-bold text-base">A4 Non-Tax Invoice Closeout Document</h3>
              </div>
              <div className="flex items-center gap-2">
                {selectedReportForInvoice.hasTransactions && (
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
                )}
                <button onClick={() => setIsInvoiceModalOpen(false)} className="text-gray-400 hover:text-black p-1">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="bg-[#FFFDF8] border border-[#E7DFD4] p-8 rounded-xl shadow-xs space-y-6 text-xs font-sans">
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
                  <p className="text-[11px] font-bold text-[#2A1E1B] mt-2">
                    Invoice Date: <span className="font-mono">{selectedReportForInvoice.date}</span>
                  </p>
                  <p className="text-[10px] text-rose-700 font-bold mt-1 uppercase">*** NON-TAX STATEMENT ***</p>
                </div>
              </div>

              {selectedReportForInvoice.hasTransactions ? (
                <>
                  <div className="grid grid-cols-3 gap-4 bg-[#F8F5F0] p-4 rounded-xl border border-[#E7DFD4]">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Register ID</p>
                      <p className="font-bold text-[#2A1E1B] mt-0.5">{selectedReportForInvoice.register}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Cashier On Duty</p>
                      <p className="font-bold text-[#2A1E1B] mt-0.5">{selectedReportForInvoice.cashier}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Shift Hours</p>
                      <p className="font-bold text-[#2A1E1B] mt-0.5">{selectedReportForInvoice.shift}</p>
                    </div>
                  </div>

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
                          <td className="p-2.5 text-right font-mono">₱{selectedReportForInvoice.openingCash.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold">Total Cash Receipts</td>
                          <td className="p-2.5 text-center">Physical Cash</td>
                          <td className="p-2.5 text-right font-mono">₱{selectedReportForInvoice.totalCashSales.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold">Digital Sales (GCash / Maya / Cards)</td>
                          <td className="p-2.5 text-center">Digital E-Wallet</td>
                          <td className="p-2.5 text-right font-mono">₱{selectedReportForInvoice.totalDigitalSales.toFixed(2)}</td>
                        </tr>
                        <tr className="bg-[#F8F5F0]">
                          <td className="p-2.5 font-bold text-rose-700">Less: Voided / Refunded Transactions</td>
                          <td className="p-2.5 text-center text-rose-700">Reversals</td>
                          <td className="p-2.5 text-right font-mono font-bold text-rose-700">
                            {selectedReportForInvoice.voidedRefundsTotal > 0 
                              ? `-₱${selectedReportForInvoice.voidedRefundsTotal.toFixed(2)}` 
                              : 'None (₱0.00)'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end pt-2">
                    <div className="w-72 space-y-2 border border-[#E7DFD4] bg-[#F8F5F0] p-4 rounded-xl text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expected Cash Drawer:</span>
                        <span className="font-bold">₱{selectedReportForInvoice.expectedCash.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Actual Counted Cash:</span>
                        <span className="font-bold">₱{selectedReportForInvoice.actualCashCount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t border-[#E7DFD4] pt-2 font-bold text-sm">
                        <span>Discrepancy:</span>
                        <span className={selectedReportForInvoice.discrepancy < 0 ? 'text-rose-600' : 'text-emerald-700'}>
                          ₱{selectedReportForInvoice.discrepancy.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-[#E7DFD4] space-y-6">
                    <div className="grid grid-cols-2 gap-12 text-center text-xs">
                      <div>
                        <div className="border-b border-[#2A1E1B] pb-1 font-bold text-[#2A1E1B]">
                          {selectedReportForInvoice.cashier}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">Cashier Signature & Date</p>
                      </div>
                      <div>
                        <div className="border-b border-[#2A1E1B] pb-1 font-bold text-[#2A1E1B]">Millicent Campillos</div>
                        <p className="text-[10px] text-gray-500 mt-1">Manager / Owner Approval</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* EMPTY STATE FOR DAYS WITHOUT TRANSACTIONS */
                <div className="py-20 text-center space-y-3">
                  <FileQuestion size={48} className="mx-auto text-[#C5A059]" />
                  <h3 className="text-lg font-bold text-[#2A1E1B]">No transaction made this day</h3>
                  <p className="text-xs text-[#8A8174] max-w-sm mx-auto">
                    There are no recorded point-of-sale transactions or register closeouts for {selectedReportForInvoice.date}.
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {pendingDeleteReport && (
        <ConfirmationModal 
          title="Delete closeout report?" 
          message={`This will permanently delete the closeout report for ${pendingDeleteReport.date}.`} 
          confirmLabel="Delete report" 
          danger 
          onCancel={() => setPendingDeleteReport(null)} 
          onConfirm={() => { 
            handleDeleteReport(pendingDeleteReport.id, pendingDeleteReport.date); 
            setPendingDeleteReport(null); 
          }} 
        />
      )}
    </div>
  );
}
