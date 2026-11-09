import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import HeaderActions from '../../components/workspace/HeaderActions';

export default function SystemAuditLogsView({ currentUser }) {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [expanded, setExpanded] = useState('');
  const token = currentUser?.accessToken;
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError('');
      try {
        if (!token) throw new Error('Superadmin authentication is required.');
        const result = await fetch(`/api/superadmin/errors?page=${page}&limit=10`, {
          signal: controller.signal, headers: { Authorization: `Bearer ${token}` },
        });
        const json = await result.json();
        if (!result.ok) throw new Error(json.message || 'Unable to fetch system errors.');
        setRows(Array.isArray(json.data) ? json.data : []);
        setTotal(Number(json.pagination?.total || 0));
      } catch (err) {
        if (err.name !== 'AbortError') { setError(err.message); setRows([]); }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    load(); return () => controller.abort();
  }, [page, refresh, token]);
  const totalPages = Math.max(1, Math.ceil(total / 10));
  return <div className="space-y-6 max-w-7xl mx-auto pb-8 text-[#2A1E1B]">
    <header className="flex items-center justify-between gap-4"><div><h1 className="text-xl font-bold">System Audit Logs</h1>
      <p className="mt-0.5 text-xs text-[#8A8174]">Backend errors and technical diagnostics — separate from operational activity</p></div><HeaderActions /></header>
    <section className="bg-white rounded-2xl border border-[#E7DFD4] shadow-sm p-6 space-y-5">
      <div className="flex items-center justify-between"><h2 className="text-lg font-bold">System Error Register <span className="ml-2 rounded-full bg-[#2A1E1B] text-white text-xs px-2 py-1">{total}</span></h2>
        <button type="button" onClick={() => setRefresh(n => n + 1)} className="text-xs flex items-center gap-2 border rounded-lg p-2"><RefreshCw size={15}/>Refresh</button></div>
      {error && <div className="text-rose-700 text-sm bg-rose-50 p-3 rounded-xl" role="alert">{error}</div>}
      <div className="overflow-x-auto border border-[#E7DFD4] rounded-xl"><table className="w-full text-left text-xs">
        <thead className="bg-[#F8F5F0] text-[#8A8174] text-[10px] uppercase"><tr>
          {['Date & Time', 'Error', 'HTTP', 'Path', 'Status', 'Details'].map(text => <th key={text} className="p-4">{text}</th>)}
        </tr></thead>
        <tbody>{loading ? <tr><td colSpan={6} className="text-center p-10">Loading system errors...</td></tr>
          : rows.length === 0 ? <tr><td colSpan={6} className="text-center p-10 text-[#8A8174]">No technical errors found.</td></tr>
          : rows.map(log => <tr key={log.id} className="border-t border-[#E7DFD4] align-top">
            <td className="p-4 whitespace-nowrap">{new Date(log.createdAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}</td>
            <td className="p-4 font-semibold">{log.errorName}</td><td className="p-4">{log.httpMethod || '—'}</td>
            <td className="p-4 break-all">{log.requestPath || '—'}</td><td className="p-4">{log.statusCode}</td>
            <td className="p-4 max-w-sm"><button type="button" className="text-[#8B5E3C] font-semibold" onClick={() => setExpanded(v => v === log.id ? '' : log.id)}>{expanded === log.id ? 'Hide details' : 'View details'}</button>
              {expanded === log.id && <div className="mt-2 p-3 bg-[#F8F5F0] whitespace-pre-wrap break-words max-h-64 overflow-auto">{log.errorMessage}{log.stackTrace ? `\n\n${log.stackTrace}` : ''}</div>}
            </td></tr>)}</tbody>
      </table></div>
      <div className="flex justify-between items-center text-xs text-[#8A8174]"><span>{total} recorded technical errors</span>
        <div className="flex items-center gap-3"><button type="button" disabled={page <= 1} onClick={() => setPage(v => v - 1)} className="border rounded-lg p-2 disabled:opacity-40"><ChevronLeft size={15}/></button>
          <span>Page {page} of {totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => setPage(v => v + 1)} className="border rounded-lg p-2 disabled:opacity-40"><ChevronRight size={15}/></button></div></div>
      <p className="text-[10px] text-[#8A8174]">This view displays stored backend error records only. Infrastructure health events that have not been logged to the database cannot appear here.</p>
    </section>
  </div>;
}
