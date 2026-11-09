import SuperAdminHeader from './SuperAdminHeader';
import DashboardContent from './DashboardContent';
import { ArrowDownToLine, ArrowUpRight, Check, ChevronLeft, ChevronRight, FileText, RefreshCw, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { auditActionOptions, formatAuditLog } from './dashboardData.js';
import { previewAuditLogs } from './superadminPreviewData';
import { useAuditLogs, useDashboardSummary } from './useSuperadminData';

// Protect spreadsheet consumers against CSV formula injection from user-entered names.
function csvCell(value) {
  const text = String(value ?? '');
  const safe = /^[\s]*[=+@\-\t\r\n]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function AuditTable({ full = false, token, preview = false, onViewAll }) {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [exported, setExported] = useState('');
  const [exporting, setExporting] = useState(false);
  const [reload, setReload] = useState(0);
  const pageSize = full ? 6 : 4;
  const { logs, total, loading, error } = useAuditLogs({ token, preview, page, limit: pageSize, search, action: filter, refresh: reload });

  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const pages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pages);

  async function download() {
    if ((!token && !preview) || exporting) return;
    setExporting(true);
    setExported('');
    try {
      const maxRows = 5000;
      const all = [];
      let nextPage = 1;
      let actualTotal = 0;
      if (preview) {
        const filtered = previewAuditLogs.map(formatAuditLog).filter(row =>
          (!filter || row.rawAction === filter) &&
          `${row.name} ${row.subject} ${row.category}`.toLowerCase().includes(query.trim().toLowerCase()),
        );
        all.push(...filtered);
        actualTotal = filtered.length;
      } else {
        do {
          const response = await api.getSuperadminAuditLogs(token, {
            page: nextPage, limit: 100, search: query.trim(), action: filter,
          });
          if (!Array.isArray(response.data)) throw new Error('Invalid audit export response.');
          all.push(...response.data.map(formatAuditLog));
          actualTotal = Number(response.pagination?.total || 0);
          nextPage += 1;
          if (response.data.length === 0) break;
        } while (all.length < Math.min(actualTotal, maxRows));
      }

      const heading = ['ID', 'User', 'Role', 'Action', 'Subject', 'Category', 'Date', 'Time'];
      const csv = [heading, ...all.slice(0, maxRows).map(row =>
        [row.id, row.name, row.role, row.action, row.subject, row.category, row.date, row.time],
      )].map(row => row.map(csvCell).join(',')).join('\r\n');
      const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `centyzz-${preview ? 'sample-' : ''}audit-logs${actualTotal > maxRows ? '-first-5000' : ''}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setExported(actualTotal > maxRows
        ? 'Exported the first 5,000 matching records. Narrow your filters to export the rest.'
        : `Exported ${all.length} matching ${preview ? 'sample ' : ''}audit logs.`);
    } catch (err) {
      setExported(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  }

  return <>
    {full && <SuperAdminHeader title="System audit logs" description="Review changes and activity across your salon." />}
    <section className="sa-card sa-audit">
    <div className="sa-audit-heading"><div><h2>{full ? 'Audit activity' : 'Audit trails & activity logs'}</h2><p>{preview ? 'Sample administrative activity for the interface preview.' : 'Recent administrative changes across your salon.'}</p></div>
      <div className="sa-audit-actions">
        <button type="button" className="sa-button sa-refresh" disabled={loading} title="Refresh audit logs" onClick={() => setReload(count => count + 1)}><RefreshCw size={15} /> <span>Refresh</span></button>
        <button type="button" className="sa-button" disabled={full && (exporting || loading || Boolean(error))} onClick={full ? download : onViewAll}>{full ? <ArrowDownToLine size={15} /> : <FileText size={15} />}{full ? (exporting ? 'Exporting…' : 'Export CSV') : 'View full logs'}{!full && <ArrowUpRight size={14} />}</button>
      </div>
    </div>
    <div className="sa-table-tools"><label className="sa-search"><Search size={16} /><input aria-label="Search activity" placeholder="Search activity, users, or services…" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} maxLength={150} /></label>
      <select aria-label="Filter actions" value={filter} onChange={event => { setFilter(event.target.value); setPage(1); }}>{auditActionOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
    </div>
    {exported && <p className="sa-inline-notice" role="status">{exported}</p>}
    {error && <div className="sa-api-error" role="alert">{error} <button type="button" onClick={() => setReload(count => count + 1)}>Try again</button></div>}
    <div className="sa-table-scroll" role="region" aria-label="Audit activity table; scroll horizontally for more columns" tabIndex={0}><table className="sa-table"><thead><tr><th>User</th><th>Action</th><th>Subject</th><th>Date & time</th></tr></thead>
      <tbody>{!loading && !error && logs.map(row => <tr key={row.id}><td><div className="sa-user-cell"><span className={`sa-table-avatar ${row.tone}`}>{row.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}</span><div><strong>{row.name}</strong><small>{row.role}</small></div></div></td>
        <td><span className={`sa-badge ${row.tone}`}><i />{row.action}</span></td>
        <td><span className="sa-subject">{row.subject}</span><small>{row.category} <span className="sa-divider-dot">·</span> #{row.id}</small></td>
        <td><span className="sa-date">{row.date}</span><small>{row.time}</small></td></tr>)}</tbody>
    </table>{loading && <div className="sa-empty" role="status">Loading audit logs…</div>}{!loading && !error && !logs.length && <div className="sa-empty">No recorded activity matches your search.</div>}</div>
    <div className="sa-table-footer"><span>{!loading && !error && total ? `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, total)}` : '0'} of {error ? '—' : total} activities</span>
      <div><button type="button" aria-label="Previous page" disabled={loading || currentPage <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16} /></button><span>{currentPage}</span><button type="button" aria-label="Next page" disabled={loading || currentPage >= pages} onClick={() => setPage(p => p + 1)}><ChevronRight size={16} /></button></div>
    </div>
    </section>
  </>;
}

export default function Overview({ name, token, preview = false, maintenance, onNavigate }) {
  const [refresh, setRefresh] = useState(0);
  const { data: summary, loading, error } = useDashboardSummary(token, preview, refresh);
  const today = new Date();
  const greeting = today.getHours() < 12 ? 'Morning' : today.getHours() < 18 ? 'Afternoon' : 'Evening';
  const date = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return <>
    <SuperAdminHeader title={`Good ${greeting}, ${name?.split(' ')[0] || 'Superadmin'}!`} description={`Today is ${date}`} />
    <div className="sa-dashboard-tools">
      <div className="sa-dashboard-context"><ShieldLabel /><span>System overview</span><span className="sa-state-pill">{preview ? 'Sample data' : loading ? 'Updating' : error ? 'Unavailable' : 'Live data'}</span></div>
      <button type="button" className="sa-button" disabled={loading} onClick={() => setRefresh(count => count + 1)}><RefreshCw size={14} />Refresh overview</button>
    </div>
    {error && <div className="sa-api-error" role="alert">{error}<button type="button" onClick={() => setRefresh(count => count + 1)}>Try again</button></div>}
    {loading && <div className="sa-loading-cards" role="status">Loading system overview…</div>}
    {summary && <DashboardContent summary={summary} onNavigate={onNavigate} maintenance={maintenance} />}
    <AuditTable token={token} preview={preview} onViewAll={() => onNavigate('audit')} />
    <footer className="sa-workspace-footer"><span>© {today.getFullYear()} Centy’zz Hair & Beauty</span><span><Check size={12} />{preview ? 'Sample data · Interface preview' : 'Superadmin system overview'}</span></footer>
  </>;
}

function ShieldLabel() {
  return <span className="sa-overview-dot" aria-hidden="true" />;
}
