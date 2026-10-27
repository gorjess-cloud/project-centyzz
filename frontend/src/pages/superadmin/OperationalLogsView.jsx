import { useEffect, useState } from 'react';
import { Archive, CheckCircle2, ChevronLeft, ChevronRight, Download, RotateCcw, Search, X, RefreshCw } from 'lucide-react';
import HeaderActions from '../../components/workspace/HeaderActions';

const API = '/api/superadmin/operational-logs';
const MODULES = ['Account & Access', 'User Management', 'Staff & Service', 'Client & Appointments', 'POS & Financial', 'Inventory', 'Permissions', 'Other Operations'];
const ROLES = ['SUPERADMIN', 'ADMIN', 'STAFF', 'CUSTOMER', 'SYSTEM', 'UNKNOWN'];
const ROLE_STYLES = {
  SUPERADMIN: 'bg-orange-50 text-orange-700', ADMIN: 'bg-green-50 text-green-700',
  STAFF: 'bg-slate-100 text-slate-600', SYSTEM: 'bg-blue-50 text-blue-700',
  CUSTOMER: 'bg-purple-50 text-purple-700', UNKNOWN: 'bg-gray-100 text-gray-500',
};
function errorText(body, fallback) {
  return Array.isArray(body?.message) ? body.message.join(' ') : body?.message || fallback;
}
function fmtDate(iso) {
  if (!iso) return ['Unknown', ''];
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return [String(iso), ''];
  return [
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', month: 'long', day: 'numeric', year: 'numeric' }).format(date),
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit' }).format(date),
  ];
}

export default function OperationalLogsView({ currentUser }) {
  const token = currentUser?.accessToken;
  const [tab, setTab] = useState('active');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [date, setDate] = useState('');
  const [module, setModule] = useState('ALL');
  const [role, setRole] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1, limit: 8 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshId, setRefreshId] = useState(0);
  const [selected, setSelected] = useState(null);
  const [archiveAction, setArchiveAction] = useState(null);
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const params = () => {
    const qs = new URLSearchParams({ page: String(page), limit: '8', archived: String(tab === 'archived') });
    if (debouncedSearch) qs.set('search', debouncedSearch);
    if (date) qs.set('date', date);
    if (module !== 'ALL') qs.set('module', module);
    if (role !== 'ALL') qs.set('role', role);
    if (status !== 'ALL') qs.set('status', status);
    return qs;
  };
  const query = params().toString();
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError('');
      try {
        if (!token) throw new Error('Superadmin authentication is required.');
        const response = await fetch(`${API}?${query}`, { signal: controller.signal, headers: { Authorization: `Bearer ${token}` } });
        const json = await response.json();
        if (!response.ok) throw new Error(errorText(json, 'Failed to load operational logs.'));
        setRows(Array.isArray(json.data) ? json.data : []);
        setPagination(json.pagination || { total: 0, totalPages: 1, page: 1, limit: 8 });
      } catch (err) {
        if (err.name !== 'AbortError') { setError(err.message); setRows([]); }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [query, token, refreshId]);
  function changeFilter(setter, value) { setter(value); setPage(1); }
  async function exportLogs() {
    setBusy(true); setError('');
    try {
      const exportParams = params(); exportParams.delete('page'); exportParams.delete('limit');
      const response = await fetch(`${API}/export?${exportParams.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) {
        const content = await response.json().catch(() => ({}));
        throw new Error(errorText(content, 'Could not export logs.'));
      }
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement('a'); anchor.href = url;
      anchor.download = `centyzz-operational-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  async function confirmArchive() {
    if (!archiveAction || !/^\d{6}$/.test(pin)) { setError('Enter your six-digit management PIN.'); return; }
    setBusy(true); setError('');
    const { row, operation } = archiveAction;
    try {
      const response = await fetch(`${API}/${row.source}/${row.sourceId}/${operation}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'x-management-pin': pin },
      });
      const json = await response.json();
      if (!response.ok) throw new Error(errorText(json, 'The log could not be updated.'));
      setToast(operation === 'archive' ? 'Moved to Archived Bin. Original record retained.' : 'Restored to Active Logs.');
      setArchiveAction(null); setPin(''); setRefreshId(n => n + 1);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  const totalPages = pagination.totalPages || 1;
  const initial = rows.length ? (page - 1) * 8 + 1 : 0;
  const final = rows.length ? (page - 1) * 8 + rows.length : 0;
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8 text-[#2A1E1B] font-sans">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div className="min-w-0"><h1 className="text-xl font-bold">Operational Activity Logs</h1>
          <p className="mt-0.5 text-xs text-[#8A8174]">Track account actions, inventory movements, service changes, and financial operations</p></div>
        <HeaderActions />
      </header>
      <div className="bg-white rounded-2xl border border-[#E7DFD4] shadow-sm p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-bold">Activity Log Register</h2>
            <span className="bg-[#2A1E1B] text-white text-xs font-bold px-2.5 py-0.5 rounded-full">{pagination.total}</span>
            <div className="flex gap-1 bg-[#F8F5F0] p-1 rounded-xl border border-[#E7DFD4]">
              {[['active','Active Logs'],['archived','Archived Bin']].map(([value,label]) => (
                <button key={value} type="button" onClick={() => { setTab(value); setPage(1); }}
                  className={`px-3.5 py-1 rounded-lg text-xs font-bold ${tab === value ? 'bg-[#2A1E1B] text-white shadow-sm' : 'text-[#8A8174]'}`}>{label}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A8174]" />
              <input aria-label="Search operational logs" value={search} onChange={event => changeFilter(setSearch,event.target.value)}
                placeholder="Search event, user, details..." className="w-64 max-w-full pl-10 pr-3 py-2 rounded-xl border border-[#E7DFD4] bg-[#F8F5F0] text-xs" /></div>
            <button type="button" title="Refresh logs" onClick={() => setRefreshId(n => n + 1)} className="p-2.5 rounded-xl border border-[#E7DFD4]"><RefreshCw size={15}/></button>
            <button type="button" onClick={exportLogs} disabled={busy || loading}
              className="bg-[#8B5E3C] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-50"><Download size={15}/>Export Logs</button>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-[10px] font-bold uppercase text-[#8A8174] space-y-1 block">Select Date
            <input type="date" value={date} onChange={event => changeFilter(setDate,event.target.value)}
              className="block bg-[#F8F5F0] border border-[#E7DFD4] rounded-xl px-3 py-2 text-xs text-[#2A1E1B]" /></label>
          {[['Module', module, setModule, ['ALL', ...MODULES]], ['Performed By', role, setRole, ['ALL', ...ROLES]],
            ['Status', status, setStatus, ['ALL', 'RECORDED']]].map(([label,value,setValue,items]) => (
            <label key={label} className="block space-y-1 text-[10px] font-bold uppercase text-[#8A8174]">{label}
              <select value={value} onChange={event => changeFilter(setValue,event.target.value)}
                className="block bg-[#F8F5F0] border border-[#E7DFD4] rounded-xl px-3 py-2 text-xs text-[#2A1E1B] min-w-32">
                {items.map(option => <option value={option} key={option}>{option === 'ALL' ? `All ${label === 'Module' ? 'Modules' : label === 'Status' ? 'Statuses' : 'Roles'}` : option}</option>)}
              </select></label>
          ))}
        </div>
        {error && <p role="alert" className="text-sm text-rose-700 bg-rose-50 rounded-lg p-3">{error}</p>}
        {toast && <div className="flex items-center justify-between bg-emerald-50 text-emerald-800 rounded-lg p-3 text-xs"><span className="flex items-center gap-2"><CheckCircle2 size={15}/>{toast}</span><button type="button" onClick={() => setToast('')} aria-label="Dismiss"><X size={14}/></button></div>}
        <div className="overflow-x-auto rounded-xl border border-[#E7DFD4]">
          <table className="w-full text-left border-collapse text-xs">
            <thead><tr className="bg-[#F8F5F0] border-b border-[#E7DFD4] text-[10px] uppercase font-bold text-[#8A8174] tracking-wider">
              {['Date & Time','Module','Event','Performed By','Details','Status','Actions'].map(head => <th key={head} className="p-4">{head}</th>)}
            </tr></thead>
            <tbody>
              {loading ? <tr><td className="text-center p-10 text-[#8A8174]" colSpan={7}>Loading operational records...</td></tr>
              : rows.length === 0 ? <tr><td className="text-center p-10 text-[#8A8174]" colSpan={7}>{error ? 'Unable to retrieve records.' : 'No matching operational logs recorded.'}</td></tr>
              : rows.map(row => {
                const [dateLabel, timeLabel] = fmtDate(row.createdAt);
                return <tr key={row.id} className="border-b last:border-b-0 border-[#EEE8DF] hover:bg-[#FFFDF9]">
                  <td className="p-4 whitespace-nowrap"><div className="font-bold">{dateLabel}</div><div className="text-[#8A8174] mt-1">{timeLabel}</div></td>
                  <td className="p-4 font-bold text-[#2A1E1B]">{row.module}</td>
                  <td className="p-4 font-bold">{row.event}</td>
                  <td className="p-4"><div className="font-bold">{row.userName}</div><span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${ROLE_STYLES[row.userRole] || ROLE_STYLES.UNKNOWN}`}>{row.userRole}</span></td>
                  <td className="p-4 max-w-64"><div className="whitespace-pre-line max-h-16 overflow-hidden">{row.details}</div>
                    <button type="button" onClick={() => setSelected(row)} className="text-[#8B5E3C] font-semibold mt-1 hover:underline">View details</button></td>
                  <td className="p-4"><span className="px-3 py-1 text-[10px] font-bold rounded-md border border-[#E7DFD4] bg-[#F8F5F0] text-[#8A8174]">RECORDED</span></td>
                  <td className="p-4"><button type="button" title={tab === 'archived' ? 'Restore record' : 'Archive record'}
                    className="p-2 hover:bg-[#F8F5F0] rounded-lg text-[#8A8174]" onClick={() => { setPin(''); setError(''); setArchiveAction({ row, operation: tab === 'archived' ? 'restore' : 'archive' }); }}>
                    {tab === 'archived' ? <RotateCcw size={17}/> : <Archive size={17}/>}</button></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap justify-between items-center gap-2 text-xs text-[#8A8174]">
          <span>Showing {initial} to {final} of {pagination.total} items</span>
          <div className="flex items-center gap-3"><button type="button" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-2 border rounded-xl disabled:opacity-40"><ChevronLeft size={16}/></button>
            <span className="font-bold text-[#2A1E1B]">Page {page} of {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-2 border rounded-xl disabled:opacity-40"><ChevronRight size={16}/></button></div>
        </div>
        <p className="text-[10px] text-[#8A8174]">These are stored events, not every action performed in the salon. Roles reflect the users' current roles; older events do not preserve role snapshots. Technical errors are shown separately in System Audit Logs.</p>
      </div>
      {selected && <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onMouseDown={() => setSelected(null)}>
        <div className="bg-white border border-[#E7DFD4] rounded-2xl p-6 w-full max-w-lg space-y-4" onMouseDown={event => event.stopPropagation()}>
          <div className="flex items-center justify-between"><h2 className="font-bold text-lg">{selected.event}</h2><button type="button" onClick={() => setSelected(null)}><X size={18}/></button></div>
          <div className="text-xs text-[#8A8174]">{selected.userName} · {selected.module} · {fmtDate(selected.createdAt).join(' ')}</div>
          <pre className="whitespace-pre-wrap break-words text-xs p-4 bg-[#F8F5F0] rounded-xl font-sans">{selected.details}</pre>
          <p className="text-xs text-[#8A8174]">Record ID: {selected.id}</p>
        </div></div>}
      {archiveAction && <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onMouseDown={() => !busy && setArchiveAction(null)}>
        <div className="bg-white border border-[#E7DFD4] rounded-2xl p-6 w-full max-w-md space-y-4" onMouseDown={event => event.stopPropagation()}>
          <h2 className="font-bold text-lg">{archiveAction.operation === 'archive' ? 'Archive Log Entry' : 'Restore Log Entry'}</h2>
          <p className="text-sm text-[#8A8174]">{archiveAction.operation === 'archive' ? 'Move this record to the Archived Bin? The original evidence will not be deleted.' : 'Return this record to Active Logs?'} Enter your management PIN to confirm.</p>
          {error && <p className="text-xs text-rose-700 bg-rose-50 rounded-lg p-2">{error}</p>}
          <input type="password" inputMode="numeric" autoComplete="off" maxLength={6} value={pin} onChange={event => setPin(event.target.value.replace(/\D/g,''))}
            placeholder="Six-digit management PIN" aria-label="Management PIN" className="w-full border border-[#E7DFD4] rounded-xl px-4 py-3 text-sm" />
          <div className="flex justify-end gap-2"><button type="button" disabled={busy} onClick={() => { setArchiveAction(null); setPin(''); }} className="border rounded-xl px-4 py-2 text-xs">Cancel</button>
            <button type="button" disabled={busy || pin.length !== 6} onClick={confirmArchive} className="bg-[#2A1E1B] text-white rounded-xl px-4 py-2 text-xs font-bold disabled:opacity-40">{busy ? 'Saving...' : 'Confirm'}</button></div>
        </div></div>}
    </div>
  );
}
