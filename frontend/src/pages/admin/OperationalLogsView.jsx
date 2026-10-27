import HeaderActions from '../../components/workspace/HeaderActions';

import { useState, useEffect, useCallback } from 'react';

import { 

  Search, 

  Download, 

  ChevronLeft, 

  ChevronRight,

  X,

  Printer,

  Trash2,

  RotateCcw,

  CheckCircle2,

  FileText

} from 'lucide-react';



export default function OperationalLogsView({ currentUser, showHeaderActions = true }) {

  const isAdminView = currentUser?.role === 'ADMIN';
  const [toastMessage, setToastMessage] = useState('');



  // Main Tab State: 'active' vs 'archived'

  const [mainTab, setMainTab] = useState('active');



  // Live records from Neon (not local placeholders)
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const API = '/api/admin/operational-logs';
  const accessToken = currentUser?.accessToken || ''; 

  const fetchLogs = useCallback(async (tab) => {
    if (!accessToken) {
      setLogs([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API}?archived=${tab === 'archived'}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error(`Failed to load operational logs (${response.status})`);
      setLogs(await response.json());
    } catch (error) {
      console.error(error);
      setToastMessage(error.message || 'Could not load operational logs');
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

 useEffect(() => {
  const timeoutId = setTimeout(() => {
    void fetchLogs(mainTab);
  }, 0);

  return () => clearTimeout(timeoutId);
}, [mainTab, fetchLogs]);
  const mutateLog = async (method, path, success, closeModal) => {
    if (!accessToken) {
      showToast('Your session is unavailable. Please sign in again.');
      return;
    }
    try {
      const response = await fetch(`${API}/${path}`, {
        method,
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error(`Action failed (${response.status})`);
      closeModal?.();
      showToast(success);
      await fetchLogs(mainTab);
    } catch (error) { showToast(error.message || 'Action failed'); }
  };

  // Filters State

  const [searchQuery, setSearchQuery] = useState('');

  const [dateFilter, setDateFilter] = useState('');

  const [moduleFilter, setModuleFilter] = useState('ALL');

  const [roleFilter, setRoleFilter] = useState('ALL');

  const [statusFilter, setStatusFilter] = useState('ALL');



  // Pagination

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 8;



  // Modals & Target Actions

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [archiveTargetLog, setArchiveTargetLog] = useState(null);

  const [deleteTargetLog, setDeleteTargetLog] = useState(null);



  const showToast = (msg) => {

    setToastMessage(msg);

    setTimeout(() => setToastMessage(''), 4000);

  };



  // Filter Logic

  const filteredLogs = logs.filter(log => {

    const matchesTab = mainTab === 'active' ? !log.isArchived : log.isArchived;



    const matchesSearch = 

      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||

      log.event.toLowerCase().includes(searchQuery.toLowerCase()) ||

      log.userName.toLowerCase().includes(searchQuery.toLowerCase());



    const matchesModule = moduleFilter === 'ALL' || log.module === moduleFilter;

    const matchesRole = roleFilter === 'ALL' || log.userRole === roleFilter;

    const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter;

    const matchesDate = !dateFilter || log.date === dateFilter;



    return matchesTab && matchesSearch && matchesModule && matchesRole && matchesStatus && matchesDate;

  });



  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;

  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);



  const renderRoleBadge = (role) => {

    if (role === 'SUPERADMIN') {

      return (

        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFE8D6] text-[#D97706] text-[9px] font-bold uppercase tracking-wider">

          <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" /> SUPERADMIN

        </span>

      );

    }

    if (role === 'ADMIN') {

      return (

        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E6F4EA] text-[#137333] text-[9px] font-bold uppercase tracking-wider">

          <span className="w-1.5 h-1.5 rounded-full bg-[#137333]" /> ADMIN

        </span>

      );

    }

    if (role === 'STAFF') {

      return (

        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F1F3F4] text-[#5F6368] text-[9px] font-bold uppercase tracking-wider">

          <span className="w-1.5 h-1.5 rounded-full bg-[#9AA0A6]" /> STAFF

        </span>

      );

    }

    return (

      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[9px] font-bold uppercase tracking-wider">

        SYSTEM

      </span>

    );

  };



  const renderStatusBadge = (status) => {

    const statusStyles = {

      'Approved': 'bg-[#E6F4EA] text-[#137333] border border-emerald-200',

      'Logged': 'bg-[#F8F5F0] text-[#8A8174] border border-[#E7DFD4]',

      'Modified': 'bg-[#FEF7E0] text-[#B08D00] border border-amber-200',

      'Updated': 'bg-[#F8F5F0] text-[#8A8174] border border-[#E7DFD4]',

      'Flagged': 'bg-[#FCE8E6] text-[#C5221F] border border-rose-200'

    };



    const style = statusStyles[status] || 'bg-gray-100 text-gray-700';



    return (

      <span className={`inline-block px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${style}`}>

        {status}

      </span>

    );

  };



  return (

    <div className="space-y-6 max-w-7xl mx-auto pb-8 text-[#2A1E1B] font-sans">



      {/* Toast Notification */}

      {toastMessage && (

        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-[#3A342B] text-[#F5F1EA] px-4 py-3 rounded-xl shadow-xl border border-[#C5A059]/40 text-xs font-semibold animate-fadeIn">

          <CheckCircle2 className="h-4 w-4 text-[#C5A059]" />

          <span>{toastMessage}</span>

        </div>

      )}



      {/* Header Bar matching Inventory */}

      <header className="mb-6 flex items-center justify-between gap-4">

        <div className="min-w-0">

          <h1 className="text-xl font-bold text-[#2A1E1B] truncate">Operational Activity Logs</h1>

          <p className="mt-0.5 text-xs text-[#8A8174] truncate">

            {isAdminView ? 'Review Admin and Staff activity, including sign-ins and sign-outs' : 'Track system audits, user actions, inventory movements, and financial overrides'}

          </p>

        </div>



        {showHeaderActions && (<HeaderActions />)}

      </header>



      {/* Main Workspace Card */}

      <div className="bg-white rounded-2xl border border-[#E7DFD4] shadow-sm p-6 space-y-6">



        {/* Title + Pill Toggle Side-by-Side */}

        <div className="flex flex-wrap items-center justify-between gap-4">

          <div className="flex items-center gap-3">

            <h2 className="text-xl font-bold text-[#2A1E1B]">Activity Log Register</h2>

            <span className="bg-[#2A1E1B] text-white text-xs font-bold px-2.5 py-0.5 rounded-full">

              {filteredLogs.length}

            </span>



            {/* Active / Archived Pill Toggle */}

            <div className="flex items-center gap-1 bg-[#F8F5F0] p-1 rounded-xl border border-[#E7DFD4] ml-2">

              <button

                onClick={() => { setMainTab('active'); setCurrentPage(1); }}

                className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all ${

                  mainTab === 'active' 

                    ? 'bg-[#2A1E1B] text-white shadow-xs' 

                    : 'text-[#8A8174] hover:text-[#2A1E1B]'

                }`}

              >

                Active Logs

              </button>

              <button

                onClick={() => { setMainTab('archived'); setCurrentPage(1); }}

                className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all ${

                  mainTab === 'archived' 

                    ? 'bg-[#2A1E1B] text-white shadow-xs' 

                    : 'text-[#8A8174] hover:text-[#2A1E1B]'

                }`}

              >

                Archived Bin

              </button>

            </div>

          </div>



          <div className="flex items-center gap-3">

            {/* Search Input */}

            <div className="relative w-64">

              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A8174]" />

              <input

                type="text"

                placeholder="Search event, user, details..."

                value={searchQuery}

                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}

                className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E7DFD4] bg-[#F8F5F0] text-xs text-[#2A1E1B] placeholder-[#8A8174] outline-none focus:border-[#C5A059] transition-all font-medium"

              />

            </div>



            <button type="button" onClick={() => fetchLogs(mainTab)} disabled={isLoading}
              className="px-3 py-2 rounded-xl border border-[#E7DFD4] text-xs font-bold flex items-center gap-2">
              <RotateCcw size={14} /><span>{isLoading ? 'Refreshing…' : 'Refresh'}</span>
            </button>
            {/* Export Logs Button */}

            <button

              onClick={() => setIsExportModalOpen(true)}

              className="bg-[#8B5E3C] hover:bg-[#724B2F] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"

            >

              <Download size={16} />

              <span>Export Logs</span>

            </button>

          </div>

        </div>



        {/* Filters Row */}

        <div className="flex flex-wrap items-center gap-3 pt-1">

          <div className="space-y-1">

            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8174] block">Select Date</span>

            <input

              type="date"

              value={dateFilter}

              onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}

              className="bg-[#F8F5F0] border border-[#E7DFD4] text-[#2A1E1B] text-xs font-semibold px-3 py-1.5 rounded-xl outline-none cursor-pointer focus:border-[#C5A059]"

            />

          </div>



          <div className="space-y-1">

            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8174] block">Module</span>

            <select

              value={moduleFilter}

              onChange={(e) => { setModuleFilter(e.target.value); setCurrentPage(1); }}

              className="bg-[#F8F5F0] border border-[#E7DFD4] text-[#2A1E1B] text-xs font-semibold px-3 py-2 rounded-xl outline-none cursor-pointer focus:border-[#C5A059]"

            >

              <option value="ALL">All Modules</option>

              <option value="POS & Financial">POS & Financial</option>

              <option value="Inventory">Inventory</option>
              <option value="Authentication & Access">Authentication &amp; Access</option>

              <option value="Staff & Service">Staff & Service</option>

              <option value="Client & Appointments">Client & Appointments</option>

            </select>

          </div>



          <div className="space-y-1">

            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8174] block">Performed By</span>

            <select

              value={roleFilter}

              onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}

              className="bg-[#F8F5F0] border border-[#E7DFD4] text-[#2A1E1B] text-xs font-semibold px-3 py-2 rounded-xl outline-none cursor-pointer focus:border-[#C5A059]"

            >

              <option value="ALL">All Roles</option>

              {!isAdminView && <option value="SUPERADMIN">SUPERADMIN</option>}

              <option value="ADMIN">ADMIN</option>

              <option value="STAFF">STAFF</option>

              {!isAdminView && <option value="SYSTEM">SYSTEM</option>}

            </select>

          </div>



          <div className="space-y-1">

            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8174] block">Status</span>

            <select

              value={statusFilter}

              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}

              className="bg-[#F8F5F0] border border-[#E7DFD4] text-[#2A1E1B] text-xs font-semibold px-3 py-2 rounded-xl outline-none cursor-pointer focus:border-[#C5A059]"

            >

              <option value="ALL">All Statuses</option>

              <option value="Approved">Approved</option>

              <option value="Logged">Logged</option>

              <option value="Modified">Modified</option>

              <option value="Updated">Updated</option>

              <option value="Flagged">Flagged</option>

            </select>

          </div>

        </div>



        {/* Data Table */}

        <div className="overflow-x-auto rounded-xl border border-[#E7DFD4]">

          <table className="w-full text-left border-collapse">

            <thead>

              <tr className="bg-[#F8F5F0] text-[10px] uppercase font-bold text-[#8A8174] tracking-wider border-b border-[#E7DFD4]">

                <th className="p-4 pl-6">Date & Time</th>

                <th className="p-4">Module</th>

                <th className="p-4">Event</th>

                <th className="p-4">Performed By</th>

                <th className="p-4">Details</th>

                <th className="p-4 text-center">Status</th>

                <th className="p-4 pr-6 text-center">Actions</th>

              </tr>

            </thead>

            <tbody className="divide-y divide-[#E7DFD4]/60 text-xs font-sans">

              {isLoading ? (<tr><td colSpan={7} className="p-8 text-center">Loading logs from Neon...</td></tr>) : paginatedLogs.length === 0 ? (

                <tr>

                  <td colSpan="7" className="p-8 text-center text-[#8A8174]">

                    {mainTab === 'active' ? 'No active logs found.' : 'Archived logs bin is empty.'}

                  </td>

                </tr>

              ) : (

                paginatedLogs.map((log) => (

                  <tr key={log.id} className="hover:bg-[#FDFBF7] transition-colors">

                    <td className="p-4 pl-6">

                      <p className="font-bold text-[#2A1E1B]">{log.displayDate}</p>

                      <p className="text-[11px] text-[#8A8174] mt-0.5">{log.time}</p>

                    </td>

                    <td className="p-4 font-bold text-[#2A1E1B]">{log.module}</td>

                    <td className="p-4 font-bold text-[#2A1E1B]">{log.event}</td>

                    <td className="p-4">

                      <p className="font-bold text-[#2A1E1B] mb-1">{log.userName}</p>

                      {renderRoleBadge(log.userRole)}

                    </td>

                    <td className="p-4 text-[#443523] whitespace-pre-line leading-relaxed">

                      {log.details}

                    </td>

                    <td className="p-4 text-center">

                      {renderStatusBadge(log.status)}

                    </td>

                    <td className="p-4 pr-6 text-center">

                      {mainTab === 'active' ? (

                        <button

                          onClick={() => setArchiveTargetLog(log)}

                          className="p-2 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"

                          title="Archive Log"

                        >

                          <Trash2 size={16} />

                        </button>

                      ) : (

                        <div className="flex items-center justify-center gap-2">

                          <button

                            onClick={() => {

                              mutateLog('PATCH', `${log.id}/restore`, 'Restored log entry back to Active Logs');

                            }}

                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center gap-1 font-bold text-[11px]"

                            title="Restore Log"

                          >

                            <RotateCcw size={14} /> Restore

                          </button>

                          <button

                            onClick={() => setDeleteTargetLog(log)}

                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"

                            title="Remove from Bin"

                          >

                            <Trash2 size={15} />

                          </button>

                        </div>

                      )}

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>



        {/* Pagination Footer */}

        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-[#8A8174] pt-2 gap-3">

          <span>Showing {paginatedLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} items</span>



          <div className="flex items-center gap-2">

            <button

              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}

              disabled={currentPage === 1}

              className="p-2 rounded-xl border border-[#E7DFD4] bg-white disabled:opacity-40 hover:bg-[#F8F5F0] transition-colors"

            >

              <ChevronLeft size={16} />

            </button>

            <span className="font-bold px-2 text-[#2A1E1B]">

              Page {currentPage} of {totalPages}

            </span>

            <button

              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}

              disabled={currentPage === totalPages}

              className="p-2 rounded-xl border border-[#E7DFD4] bg-white disabled:opacity-40 hover:bg-[#F8F5F0] transition-colors"

            >

              <ChevronRight size={16} />

            </button>

          </div>

        </div>



      </div>



      {/* ================= MODAL: EXPORT / PRINTABLE AUDIT REPORT ================= */}

      {isExportModalOpen && (

        <div className="fixed inset-0 z-50 w-screen h-screen flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">

          <div className="bg-white rounded-2xl border border-[#E7DFD4] shadow-2xl max-w-4xl w-full p-8 my-auto max-h-[90vh] overflow-y-auto text-[#2A1E1B] space-y-6">



            {/* Header Control bar */}

            <div className="flex items-center justify-between border-b border-[#E7DFD4] pb-4 print:hidden">

              <div className="flex items-center gap-2">

                <FileText className="text-[#C5A059] h-5 w-5" />

                <h3 className="font-bold text-base">Operational Activity Export Document</h3>

              </div>

              <div className="flex items-center gap-2">

                <button

                  type="button"

                  onClick={() => window.print()}

                  className="px-4 py-2 rounded-xl bg-[#2A1E1B] text-white hover:bg-[#C5A059] text-xs font-bold flex items-center gap-2 shadow-sm transition-all"

                >

                  <Printer size={14} />

                  <span>Print Document</span>

                </button>

                <button 

                  type="button"

                  onClick={() => setIsExportModalOpen(false)} 

                  className="text-gray-400 hover:text-black p-1"

                >

                  <X size={20} />

                </button>

              </div>

            </div>



            {/* Printable Document Sheet */}

            <div id="printable-log-document" className="bg-[#FFFDF8] border border-[#E7DFD4] p-8 rounded-xl shadow-xs space-y-6 text-xs font-sans">



              <div className="flex justify-between items-start border-b-2 border-[#2A1E1B] pb-6">

                <div>

                  <h1 className="text-2xl font-serif font-bold text-[#2A1E1B] tracking-wide">CENTY'ZZ SALON</h1>

                  <p className="text-[10px] uppercase tracking-widest text-[#C5A059] font-bold">Operational Audit & Activity Log</p>

                  <p className="text-[11px] text-[#8A8174] mt-1">Unit A, Block 15 Lot 2, Bagumbong, Caloocan City</p>

                </div>



                <div className="text-right">

                  <h2 className="text-xl font-bold tracking-wider text-[#2A1E1B]">AUDIT RECORD</h2>

                  <p className="text-[11px] font-bold text-[#2A1E1B] mt-1">Ref: OAL-{new Date().toISOString().slice(0, 10)}</p>

                  <p className="text-[11px] text-[#8A8174]">Export Date: {new Date().toLocaleDateString('en-CA')}</p>

                  <p className="text-[11px] text-[#8A8174]">Generated from live Neon operational logs</p>

                </div>

              </div>



              {/* Filters Summary Block */}

              <div className="bg-[#F8F5F0] border border-[#E7DFD4] p-4 rounded-xl text-xs space-y-1">

                <p className="font-bold uppercase text-[10px] text-[#8A8174]">Applied Export Filters:</p>

                <div className="flex flex-wrap gap-x-6 text-[#2A1E1B]">

                  <span>Date: <strong>{dateFilter || 'All Dates'}</strong></span>

                  <span>Module: <strong>{moduleFilter}</strong></span>

                  <span>Role: <strong>{roleFilter}</strong></span>

                  <span>Status: <strong>{statusFilter}</strong></span>

                </div>

              </div>



              {/* Table */}

              <table className="w-full border-collapse border border-[#E7DFD4] text-xs">

                <thead>

                  <tr className="bg-[#2A1E1B] text-white text-[10px] uppercase font-bold">

                    <th className="p-2.5 text-left">Date & Time</th>

                    <th className="p-2.5 text-left">Module</th>

                    <th className="p-2.5 text-left">Event</th>

                    <th className="p-2.5 text-left">Performed By</th>

                    <th className="p-2.5 text-left">Details</th>

                    <th className="p-2.5 text-center">Status</th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-[#E7DFD4] font-sans">

                  {filteredLogs.map((log) => (

                    <tr key={log.id}>

                      <td className="p-2.5 align-top">

                        <p className="font-bold">{log.displayDate}</p>

                        <span className="text-gray-500 text-[10px]">{log.time}</span>

                      </td>

                      <td className="p-2.5 align-top font-bold">{log.module}</td>

                      <td className="p-2.5 align-top font-bold">{log.event}</td>

                      <td className="p-2.5 align-top">

                        <p className="font-bold">{log.userName}</p>

                        <span className="text-gray-500 text-[9px] uppercase">({log.userRole})</span>

                      </td>

                      <td className="p-2.5 align-top whitespace-pre-line text-gray-700">{log.details}</td>

                      <td className="p-2.5 align-top text-center font-bold">{log.status}</td>

                    </tr>

                  ))}

                </tbody>

              </table>



              {/* Note & Signatures */}

              <div className="pt-8 border-t border-[#E7DFD4] flex justify-between items-end">

                <div className="text-[10px] text-[#8A8174]">

                  <p className="font-bold text-[#2A1E1B]">Confidential Internal Record</p>

                  <p>Generated by Centy'zz Salon Management System</p>

                </div>

                <div className="text-center w-48">

                  <div className="border-b border-[#2A1E1B] pb-1 font-bold text-xs">Authorized Signatory</div>

                  <p className="text-[10px] text-[#8A8174] mt-1">Authorized Signature</p>

                </div>

              </div>



            </div>



          </div>

        </div>

      )}



      {/* ================= MODAL: ARCHIVE CONFIRMATION ================= */}

      {archiveTargetLog && (

        <div className="fixed inset-0 z-50 w-screen h-screen flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">

          <div className="bg-white rounded-3xl border border-[#E7DFD4] shadow-2xl max-w-md w-full p-6 space-y-5 text-[#2A1E1B]">

            <div className="flex items-center justify-between border-b border-[#E7DFD4] pb-3">

              <h3 className="font-bold text-base">Archive Log Entry</h3>

              <button onClick={() => setArchiveTargetLog(null)} className="text-gray-400 hover:text-black">

                <X size={18} />

              </button>

            </div>



            <p className="text-xs text-gray-600 leading-relaxed">

              Are you sure you want to move this log entry (<strong className="text-[#2A1E1B]">{archiveTargetLog.event}</strong>) to the Archived Bin?

            </p>



            <div className="flex items-center justify-end gap-3 pt-2">

              <button

                onClick={() => setArchiveTargetLog(null)}

                className="px-4 py-2 rounded-xl border border-[#E7DFD4] text-xs font-bold text-gray-600 hover:bg-[#F8F5F0]"

              >

                Cancel

              </button>

              <button

                onClick={() => {

                  mutateLog('PATCH', `${archiveTargetLog.id}/archive`, 'Moved log entry to Archived Bin', () => setArchiveTargetLog(null));

                }}

                className="px-5 py-2 rounded-xl bg-[#2A1E1B] text-white text-xs font-bold hover:bg-[#C5A059] transition-all"

              >

                Move to Archive

              </button>

            </div>

          </div>

        </div>

      )}



      {/* ================= MODAL: PERMANENT DELETE CONFIRMATION ================= */}

      {deleteTargetLog && (

        <div className="fixed inset-0 z-50 w-screen h-screen flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">

          <div className="bg-white rounded-3xl border border-rose-200 shadow-2xl max-w-md w-full p-6 space-y-5 text-[#2A1E1B]">

            <div className="flex items-center justify-between border-b border-[#E7DFD4] pb-3">

              <h3 className="font-bold text-base text-rose-700">Remove Archived Log</h3>

              <button onClick={() => setDeleteTargetLog(null)} className="text-gray-400 hover:text-black">

                <X size={18} />

              </button>

            </div>



            <p className="text-xs text-gray-600 leading-relaxed">

              This removes the entry from the visible archive. For audit integrity, the database retains the record. Continue?

            </p>



            <div className="flex items-center justify-end gap-3 pt-2">

              <button

                onClick={() => setDeleteTargetLog(null)}

                className="px-4 py-2 rounded-xl border border-[#E7DFD4] text-xs font-bold text-gray-600 hover:bg-[#F8F5F0]"

              >

                Cancel

              </button>

              <button

                onClick={() => {

                  mutateLog('DELETE', `${deleteTargetLog.id}`, 'Removed from visible archive (retained for audit)', () => setDeleteTargetLog(null));

                }}

                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all"

              >

                Remove from Bin

              </button>

            </div>

          </div>

        </div>

      )}



      {/* Print CSS Rules */}

      <style>{`

        @media print {

          body * {

            visibility: hidden;

          }

          #printable-log-document, #printable-log-document * {

            visibility: visible;

          }

          #printable-log-document {

            position: absolute;

            left: 0;

            top: 0;

            width: 100%;

          }

        }

      `}</style>



    </div>

  );

}