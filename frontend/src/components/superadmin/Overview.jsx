import HeaderActions from '../workspace/HeaderActions';
import {
  ArrowDownToLine, ArrowUpRight, Check, ChevronLeft, ChevronRight,
  FileText, KeyRound, RefreshCw, Search, ShieldCheck, Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { auditActionOptions, buildDashboardMetrics, formatAuditLog } from './dashboardData.js';

function MetricCard({ metric }) {
  const total = metric.items.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const Icon = { users: Users, key: KeyRound, shield: ShieldCheck }[metric.icon];

  return <article className="sa-metric sa-card">
    <div className="sa-card-heading"><div><h2>{metric.title}</h2><p>{metric.subtitle}</p></div><span className="sa-icon-tile"><Icon size={18} /></span></div>
    <div className="sa-metric-content">
      <div className="sa-donut" role="img" aria-label={`${metric.title}: ${metric.items.map(item => `${item.label} ${item.value}`).join(', ')}`}>
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="48" fill="none" stroke="#f4f0e8" strokeWidth="14" />
          {total > 0 && metric.items.map((item, index) => {
            const length = Number(item.value || 0) / total * 100;
            const start = metric.items.slice(0, index).reduce((sum, part) => sum + Number(part.value || 0) / total * 100, 0);
            return <circle key={item.label} cx="60" cy="60" r="48" pathLength="100" fill="none" stroke={item.color} strokeWidth="14" strokeDasharray={`${length} ${100 - length}`} strokeDashoffset={-start} transform="rotate(-90 60 60)" />;
          })}
        </svg>
        <div><strong>{total.toLocaleString()}</strong><span>{metric.label}</span></div>
      </div>
      <ul className="sa-legend">{metric.items.map(item => <li key={item.label}>
        <span className="sa-dot" style={{ background: item.color }} />
        <span>{item.label}</span><b>{Number(item.value || 0).toLocaleString()}</b>
        <small>{total ? (Number(item.value || 0) / total * 100).toFixed(1) : '0.0'}%</small>
      </li>)}</ul>
    </div>
    <div className="sa-metric-footer"><span className="sa-gold-text">{metric.footer}</span><span title={metric.footnote}>{metric.footnote}</span></div>
  </article>;
}

// Protect spreadsheet consumers against CSV formula injection from user-entered names.
function csvCell(value) {
  const text = String(value ?? '');
  const safe = /^[\s]*[=+@\-\t\r\n]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function AuditTable({ full = false, token, onViewAll }) {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exported, setExported] = useState('');
  const [exporting, setExporting] = useState(false);
  const [reload, setReload] = useState(0);
  const pageSize = full ? 6 : 4;

  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let live = true;
    if (!token) {
      setLoading(false);
      setError('Sign in as a Superadmin to view actual audit logs. Demo sessions cannot access the API.');
      return;
    }
    setLoading(true);
    setError('');
    api.getSuperadminAuditLogs(token, { page, limit: pageSize, search, action: filter })
      .then(result => {
        if (!live) return;
        if (!Array.isArray(result.data)) throw new Error('Invalid audit log response from server.');
        setLogs(result.data.map(formatAuditLog));
        setTotal(Number(result.pagination?.total || 0));
      })
      .catch(err => { if (live) { setError(err.message); setLogs([]); setTotal(0); } })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [token, page, pageSize, filter, search, reload]);

  const pages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pages);

  async function download() {
    if (!token || exporting) return;
    setExporting(true);
    setExported('');
    try {
      const maxRows = 5000;
      const all = [];
      let nextPage = 1;
      let actualTotal = 0;
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

      const heading = ['ID', 'User', 'Role', 'Action', 'Subject', 'Category', 'Date', 'Time'];
      const csv = [heading, ...all.slice(0, maxRows).map(row =>
        [row.id, row.name, row.role, row.action, row.subject, row.category, row.date, row.time],
      )].map(row => row.map(csvCell).join(',')).join('\r\n');
      const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `centyzz-audit-logs${actualTotal > maxRows ? '-first-5000' : ''}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setExported(actualTotal > maxRows
        ? 'Exported the first 5,000 matching records. Narrow your filters to export the rest.'
        : `Exported ${all.length} matching audit logs.`);
    } catch (err) {
      setExported(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  }

  return <section className="sa-card sa-audit">
    <div className="sa-audit-heading"><div><span className="sa-eyebrow">ACTIVITY MONITOR</span><h2>{full ? 'System audit logs' : 'Audit trails & activity logs'}</h2><p>Actual recorded changes across your salon.</p></div>
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
    <div className="sa-table-scroll"><table className="sa-table"><thead><tr><th>User</th><th>Action</th><th>Subject</th><th>Date & time</th></tr></thead>
      <tbody>{!loading && !error && logs.map(row => <tr key={row.id}><td><div className="sa-user-cell"><span className={`sa-table-avatar ${row.tone}`}>{row.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}</span><div><strong>{row.name}</strong><small>{row.role}</small></div></div></td>
        <td><span className={`sa-badge ${row.tone}`}><i />{row.action}</span></td>
        <td><span className="sa-subject">{row.subject}</span><small>{row.category} <span className="sa-divider-dot">·</span> #{row.id}</small></td>
        <td><span className="sa-date">{row.date}</span><small>{row.time}</small></td></tr>)}</tbody>
    </table>{loading && <div className="sa-empty" role="status">Loading audit logs…</div>}{!loading && !error && !logs.length && <div className="sa-empty">No recorded activity matches your search.</div>}</div>
    <div className="sa-table-footer"><span>{!loading && !error && total ? `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, total)}` : '0'} of {error ? '—' : total} activities</span>
      <div><button type="button" aria-label="Previous page" disabled={loading || currentPage <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16} /></button><span>{currentPage}</span><button type="button" aria-label="Next page" disabled={loading || currentPage >= pages} onClick={() => setPage(p => p + 1)}><ChevronRight size={16} /></button></div>
    </div>
  </section>;
}

export default function Overview({ name, token, onNavigate }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let live = true;
    if (!token) {
      setLoading(false);
      setError('Sign in as a Superadmin to view live dashboard statistics. Demo sessions have no database access.');
      return;
    }
    setLoading(true);
    setError('');
    api.getSuperadminDashboardSummary(token)
      .then(result => {
        if (!live) return;
        if (!result.data?.accounts || !result.data?.codes || !result.data?.errors) throw new Error('Invalid summary response from server.');
        setSummary(result.data);
      })
      .catch(err => { if (live) { setSummary(null); setError(err.message); } })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [token, refresh]);

  const metrics = summary ? buildDashboardMetrics(summary) : [];
  return <>
    <div className="sa-welcome"><div><div className="sa-eyebrow">YOUR SALON, CONNECTED</div><h1>Welcome back, {name?.split(' ')[0] || 'Superadmin'}. <span className="sa-welcome-spark">✦</span></h1><p>Here’s what’s happening across your system today.</p></div>
      <div className="sa-overview-tools"><HeaderActions />
        <button type="button" className="sa-button" disabled={loading} onClick={() => setRefresh(count => count + 1)} title="Refresh dashboard statistics"><RefreshCw size={14} /> Refresh</button>
        <div className="sa-status" role="status"><span className="sa-dot" />System overview <span className="sa-status-line" /> {loading ? 'Loading…' : error ? 'Unavailable' : 'Live database'}</div>
      </div>
    </div>
    {error && <div className="sa-api-error" role="alert">{error} <button type="button" onClick={() => setRefresh(count => count + 1)}>Try again</button></div>}
    {loading && <div className="sa-loading-cards" role="status">Loading live account, verification, and error statistics…</div>}
    {!loading && !error && <div className="sa-metrics">{metrics.map(metric => <MetricCard key={metric.title} metric={metric} />)}</div>}
    <div className="sa-security-note"><span className="sa-note-icon"><ShieldCheck size={19} /></span><div><strong>A little oversight goes a long way.</strong><span>Review recorded changes to help keep your salon’s data protected.</span></div><button type="button" onClick={() => onNavigate('audit')}>Review audit logs <ArrowUpRight size={15} /></button></div>
    <AuditTable token={token} onViewAll={() => onNavigate('audit')} />
    <footer className="sa-workspace-footer"><span>© {new Date().getFullYear()} Centy’zz Hair & Beauty</span><span><Check size={12} /> Superadmin workspace <span>·</span> Database-connected dashboard</span></footer>
  </>;
}
