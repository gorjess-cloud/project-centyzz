import HeaderActions from '../workspace/HeaderActions';
import { ArrowDownToLine, ArrowUpRight, Check, ChevronLeft, ChevronRight, FileText, KeyRound, Search, ShieldCheck, Users } from 'lucide-react';
import { useState } from 'react';
import { activity, metrics } from './dashboardData';

function MetricCard({ metric }) {
  const total = metric.items.reduce((sum, item) => sum + item.value, 0);
  const Icon = { users: Users, key: KeyRound, shield: ShieldCheck }[metric.icon];

  return <article className="sa-metric sa-card">
    <div className="sa-card-heading"><div><h2>{metric.title}</h2><p>{metric.subtitle}</p></div><span className="sa-icon-tile"><Icon size={18} /></span></div>
    <div className="sa-metric-content">
      <div className="sa-donut" role="img" aria-label={`${metric.title}: ${metric.items.map(i => `${i.label} ${i.value}`).join(', ')}`}>
        <svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="48" fill="none" stroke="#f4f0e8" strokeWidth="14" />
          {metric.items.map((item, index) => { const length = item.value / total * 100; const start = metric.items.slice(0, index).reduce((sum, segment) => sum + segment.value / total * 100, 0); return <circle key={item.label} cx="60" cy="60" r="48" pathLength="100" fill="none" stroke={item.color} strokeWidth="14" strokeDasharray={`${length} ${100 - length}`} strokeDashoffset={-start} transform="rotate(-90 60 60)" />; })}
        </svg><div><strong>{total}</strong><span>{metric.label}</span></div>
      </div>
      <ul className="sa-legend">{metric.items.map(item => <li key={item.label}><span className="sa-dot" style={{ background: item.color }} /><span>{item.label}</span><b>{item.value}</b><small>{(item.value / total * 100).toFixed(1)}%</small></li>)}</ul>
    </div>
    <div className="sa-metric-footer">{metric.icon === 'users' ? <><span className="sa-positive">77.3% active</span><span>across all roles</span></> : metric.icon === 'key' ? <><span className="sa-gold-text">6 awaiting review</span><span>sample requests</span></> : <><span className="sa-rose-text">2 high-priority alerts</span><span>need attention</span></>}</div>
  </article>;
}

export function AuditTable({ full = false, onViewAll }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All actions');
  const [page, setPage] = useState(0);
  const [exported, setExported] = useState(false);
  const filtered = activity.filter(row => `${row.name} ${row.subject} ${row.category}`.toLowerCase().includes(query.toLowerCase()) && (filter === 'All actions' || row.action === filter));
  const pageSize = full ? 6 : 4;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages - 1);
  const rows = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  function download() {
    const csv = ['ID,User,Role,Action,Subject,Date,Time', ...filtered.map(row => [row.id, row.name, row.role, row.action, row.subject, row.date, row.time].map(value => `"${value.replaceAll('"', '""')}"`).join(','))].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a'); link.href = url; link.download = 'centyzz-sample-audit-logs.csv'; link.click(); URL.revokeObjectURL(url); setExported(true);
  }
  return <section className="sa-card sa-audit">
    <div className="sa-audit-heading"><div><span className="sa-eyebrow">ACTIVITY MONITOR</span><h2>{full ? 'System audit logs' : 'Audit trails & activity logs'}</h2><p>A clear view of changes across your salon.</p></div><button className="sa-button" onClick={full ? download : onViewAll}>{full ? <ArrowDownToLine size={15} /> : <FileText size={15} />}{full ? 'Export CSV' : 'View full logs'}{!full && <ArrowUpRight size={14} />}</button></div>
    <div className="sa-table-tools"><label className="sa-search"><Search size={16} /><input aria-label="Search activity" placeholder="Search activity, users, or services…" value={query} onChange={event => { setQuery(event.target.value); setPage(0); }} /></label><select aria-label="Filter actions" value={filter} onChange={event => { setFilter(event.target.value); setPage(0); }}><option>All actions</option>{['Changed', 'Updated', 'Deleted', 'Granted', 'Created'].map(action => <option key={action}>{action}</option>)}</select></div>
    {exported && <p className="sa-inline-notice" role="status">Sample audit logs exported.</p>}
    <div className="sa-table-scroll"><table className="sa-table"><thead><tr><th>User</th><th>Action</th><th>Subject</th><th>Date & time</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><div className="sa-user-cell"><span className={`sa-table-avatar ${row.tone}`}>{row.name.split(' ').slice(0, 2).map(n => n[0]).join('')}</span><div><strong>{row.name}</strong><small>{row.role}</small></div></div></td><td><span className={`sa-badge ${row.tone}`}><i />{row.action}</span></td><td><span className="sa-subject">{row.subject}</span><small>{row.category} <span className="sa-divider-dot">·</span> {row.id}</small></td><td><span className="sa-date">{row.date}</span><small>{row.time}</small></td></tr>)}</tbody></table>{!rows.length && <div className="sa-empty">No activity matches your search.</div>}</div>
    <div className="sa-table-footer"><span>{filtered.length ? `${currentPage * pageSize + 1}–${Math.min((currentPage + 1) * pageSize, filtered.length)}` : '0'} of {filtered.length} activities</span><div><button aria-label="Previous page" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={16} /></button><span>{currentPage + 1}</span><button aria-label="Next page" disabled={currentPage >= pages - 1} onClick={() => setPage(currentPage + 1)}><ChevronRight size={16} /></button></div></div>
  </section>;
}

export default function Overview({ name, onNavigate }) {
  return <><div className="sa-welcome"><div><div className="sa-eyebrow">YOUR SALON, CONNECTED</div><h1>Welcome back, {name.split(' ')[0]}. <span className="sa-welcome-spark">✦</span></h1><p>Here’s what’s happening across your system today.</p></div><div className="sa-overview-tools"><HeaderActions /><div className="sa-status"><span className="sa-dot" />System overview <span className="sa-status-line" /> Sample data</div></div></div>
    <div className="sa-metrics">{metrics.map(metric => <MetricCard key={metric.title} metric={metric} />)}</div>
    <div className="sa-security-note"><span className="sa-note-icon"><ShieldCheck size={19} /></span><div><strong>A little oversight goes a long way.</strong><span>Review your security alerts to keep your salon’s data protected.</span></div><button onClick={() => onNavigate('audit')}>Review audit logs <ArrowUpRight size={15} /></button></div>
    <AuditTable onViewAll={() => onNavigate('audit')} />
    <footer className="sa-workspace-footer"><span>© {new Date().getFullYear()} Centy’zz Hair & Beauty</span><span><Check size={12} /> Superadmin workspace <span>·</span> Frontend preview</span></footer>
  </>;
}
