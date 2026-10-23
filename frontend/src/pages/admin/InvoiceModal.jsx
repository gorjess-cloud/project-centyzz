import { FileText, Printer, X } from 'lucide-react';

export default function InvoiceModal({ 
  isOpen, 
  onClose, 
  selectedReport, 
  selectedDate, 
  closeoutInfo, 
  kpiData, 
  openingCash, 
  totalCashSales, 
  totalDigitalSales, 
  expectedCash, 
  actualCashNum, 
  discrepancy, 
  showToast 
}) {
  if (!isOpen) return null;

  const invoiceDate = selectedReport?.date || selectedDate;
  const cashierName = selectedReport?.cashier || closeoutInfo?.cashier || 'Aljean Mark A. Angeles';

  return (
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
            <button onClick={onClose} className="text-gray-400 hover:text-black p-1">
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
              <p className="text-[11px] text-[#8A8174]">Issue Date: {invoiceDate}</p>
              <p className="text-[10px] text-rose-700 font-bold mt-1 uppercase">*** NON-TAX STATEMENT ***</p>
            </div>
          </div>

          {/* Shift Information Grid */}
          <div className="grid grid-cols-3 gap-4 bg-[#F8F5F0] p-4 rounded-xl border border-[#E7DFD4]">
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">Register ID</p>
              <p className="font-bold text-[#2A1E1B] mt-0.5">{closeoutInfo?.register || 'REGISTER 01'}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">Cashier On Duty</p>
              <p className="font-bold text-[#2A1E1B] mt-0.5">{cashierName}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">Shift Hours</p>
              <p className="font-bold text-[#2A1E1B] mt-0.5">{closeoutInfo?.shift || '08:00 AM – 08:00 PM'}</p>
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
                  <td className="p-2.5 text-right font-mono">₱{Number(openingCash || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">Total Cash Receipts</td>
                  <td className="p-2.5 text-center">Physical Cash</td>
                  <td className="p-2.5 text-right font-mono">₱{Number(totalCashSales || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">Digital Sales (GCash / Maya / Cards)</td>
                  <td className="p-2.5 text-center">Digital E-Wallet</td>
                  <td className="p-2.5 text-right font-mono">₱{Number(totalDigitalSales || 0).toFixed(2)}</td>
                </tr>
                <tr className="bg-[#F8F5F0]">
                  <td className="p-2.5 font-bold text-rose-700">Less: Voided / Refunded Transactions</td>
                  <td className="p-2.5 text-center text-rose-700">Reversals</td>
                  <td className="p-2.5 text-right font-mono font-bold text-rose-700">-{kpiData?.voidedRefunds || '₱0.00'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Cash Reconciliation Calculation */}
          <div className="flex justify-end pt-2">
            <div className="w-72 space-y-2 border border-[#E7DFD4] bg-[#F8F5F0] p-4 rounded-xl text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Expected Cash Drawer:</span>
                <span className="font-bold">₱{Number(expectedCash || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Actual Counted Cash:</span>
                <span className="font-bold">₱{Number(actualCashNum || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-[#E7DFD4] pt-2 font-bold text-sm">
                <span>Discrepancy:</span>
                <span className={Number(discrepancy || 0) < 0 ? 'text-rose-600' : 'text-emerald-700'}>
                  ₱{Number(discrepancy || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Signatures & Disclaimers */}
          <div className="pt-8 border-t border-[#E7DFD4] space-y-6">
            <div className="grid grid-cols-2 gap-12 text-center text-xs">
              <div>
                <div className="border-b border-[#2A1E1B] pb-1 font-bold text-[#2A1E1B]">{cashierName}</div>
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
  );
}