import { ArrowRight, Database, KeyRound, ShieldCheck, TriangleAlert, UserCheck, Users, UserX } from 'lucide-react';

export default function DashboardContent({ summary, onNavigate, maintenance }) {
  const total = Number(summary.totalUsers || 0);
  const active = Number(summary.accounts.active || 0);
  const inactive = Number(summary.accounts.inactive || 0);
  const errors = Number(summary.errors.last24Hours || 0);
  const stats = [
    { label: 'Managed accounts', value: total, detail: 'Across all system roles', icon: Users, tone: 'gold' },
    { label: 'Active accounts', value: active, detail: `${total ? Math.round(active / total * 100) : 0}% of registered accounts`, icon: UserCheck },
    { label: 'Inactive accounts', value: inactive, detail: 'Review account access', icon: UserX },
    { label: 'System errors', value: errors, detail: 'Recorded in the last 24 hours', icon: TriangleAlert, tone: errors > 0 ? 'alert' : '' },
  ];
  const statuses = [
    { label: 'Active', value: active, color: '#829b78' },
    { label: 'Inactive', value: inactive, color: '#c5a059' },
    { label: 'Archived', value: Number(summary.accounts.archived || 0), color: '#aa9680' },
  ];
  const attention = [
    { title: 'Account access', detail: `${inactive} inactive ${inactive === 1 ? 'account' : 'accounts'} to review`, value: inactive, icon: UserX, page: 'users' },
    { title: 'Password recovery', detail: `${summary.codes.recovery} active recovery codes`, value: Number(summary.codes.recovery || 0), icon: KeyRound, page: 'users' },
    { title: 'System reliability', detail: `${errors} errors recorded in the past 24 hours`, value: errors, icon: TriangleAlert, page: 'logs' },
  ];

  return <>
    <div className="sa-stat-grid">
      {stats.map(({ label, value, detail, icon: Icon, tone }) => (
        <article className={`sa-stat-card ${tone ? `is-${tone}` : ''}`} key={label}>
          <div className="sa-stat-label"><span>{label}</span><Icon size={18} /></div>
          <strong>{value.toLocaleString()}</strong>
          <p>{detail}</p>
        </article>
      ))}
    </div>

    <div className="sa-overview-grid">
      <section className="sa-card sa-access-panel" aria-labelledby="account-access-title">
        <div className="sa-panel-heading"><div><h2 id="account-access-title">Account access overview</h2><p>See how access is distributed across the system.</p></div><Users size={19} /></div>
        <div className="sa-access-total"><strong>{total.toLocaleString()}</strong><span>registered accounts</span></div>
        <div className="sa-access-bars">
          {statuses.map(status => {
            const percent = total ? Math.min(100, status.value / total * 100) : 0;
            return <div className="sa-access-row" key={status.label}>
              <div><span><i style={{ background: status.color }} />{status.label}</span><span><b>{status.value.toLocaleString()}</b><small>{percent.toFixed(1)}%</small></span></div>
              <div className="sa-progress-track" role="meter" aria-label={`${status.label} accounts`} aria-valuemin={0} aria-valuemax={Math.max(1, total)} aria-valuenow={status.value}><span style={{ width: `${percent}%`, background: status.color }} /></div>
            </div>;
          })}
        </div>
        <button type="button" className="sa-text-button" onClick={() => onNavigate('users')}>Manage user accounts <ArrowRight size={14} /></button>
      </section>

      <section className="sa-card sa-attention-panel" aria-labelledby="attention-title">
        <div className="sa-panel-heading"><div><h2 id="attention-title">Needs your attention</h2><p>A focused view of access and system follow-ups.</p></div><ShieldCheck size={19} /></div>
        <div className="sa-attention-list">
          {attention.map(({ title, detail, value, icon: Icon, page }) => <button type="button" key={title} onClick={() => onNavigate(page)}>
            <span className="sa-attention-icon"><Icon size={18} /></span>
            <span><strong>{title}</strong><small>{detail}</small></span>
            <span className={`sa-count-pill${value ? ' has-items' : ''}`}>{value}</span><ArrowRight size={14} />
          </button>)}
        </div>
        <p className="sa-panel-note">Maintenance preview <span className={`sa-state-pill${maintenance?.enabled ? ' is-warning' : ''}`}>{maintenance?.enabled ? 'Enabled' : 'Off'}</span><button type="button" onClick={() => onNavigate('settings')}>Open settings <ArrowRight size={13} /></button></p>
      </section>
    </div>

    <div className="sa-quick-actions" aria-label="Superadmin quick actions">
      {[
        { label: 'Permission controls', description: 'Review workspace access by role', icon: ShieldCheck, page: 'roles' },
        { label: 'Database & maintenance', description: 'Manage backups and service windows', icon: Database, page: 'settings' },
        { label: 'System audit logs', description: 'Trace administrative changes', icon: KeyRound, page: 'audit' },
      ].map(({ label, description, icon: Icon, page }) => <button type="button" key={page} onClick={() => onNavigate(page)}>
        <span className="sa-attention-icon"><Icon size={19} /></span><span><strong>{label}</strong><small>{description}</small></span><ArrowRight size={16} />
      </button>)}
    </div>
  </>;
}
