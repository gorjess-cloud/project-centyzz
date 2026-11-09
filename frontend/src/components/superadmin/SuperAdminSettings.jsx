import SuperadminBackupManager from './SuperadminBackupManager';
import './maintenance-v2.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Clock3, Database, Download, FileArchive, HardDrive, Info, RefreshCw, ShieldCheck, Wrench, X } from 'lucide-react';
import SuperAdminHeader from './SuperAdminHeader';

const DURATIONS = ['30 minutes', '1 hour', '2 hours', '4 hours'];
const DEFAULT_MAINTENANCE = { enabled: false, message: 'We are making a few improvements. Please check back shortly.', duration: '1 hour', updatedAt: null };

function formatDate(value) {
  if (!value || !Number.isFinite(Date.parse(value))) return '—';
  return new Date(value).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}
function formatSize(bytes) {
  const number = Number(bytes);
  if (!Number.isFinite(number) || number < 0) return 'Not recorded';
  if (number >= 1024 ** 3) return `${(number / (1024 ** 3)).toFixed(2)} GB`;
  if (number >= 1024 ** 2) return `${(number / (1024 ** 2)).toFixed(2)} MB`;
  return `${Math.round(number / 1024)} KB`;
}
function normalizeJobs(rows) {
  if (!Array.isArray(rows)) throw new Error('Unexpected backup history response.');
  return rows.map(row => ({
    ...row,
    id: String(row.id),
    name: row.storageObjectKey?.split('/').pop() || `Backup job ${row.id}`,
    createdAt: row.requestedAt,
    sizeBytes: row.fileSizeBytes,
    status: String(row.status || 'UNKNOWN').toUpperCase(),
  }));
}
async function settingsRequest(path, token, { method = 'GET', pin, body } = {}) {
  const response = await fetch(path, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(pin ? { 'x-management-pin': pin } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const raw = await response.text();
  let result;
  try { result = raw.trim() ? JSON.parse(raw) : {}; }
  catch { throw new Error('The server returned an invalid response.'); }
  if (!response.ok) {
    const message = Array.isArray(result.message) ? result.message.join(' ') : result.message;
    throw new Error(message || `Request failed (${response.status}).`);
  }
  return result;
}
function downloadManifest(backup) {
  const manifest = {
    kind: 'Centyzz database backup metadata (not a database restore file)',
    id: backup.id,
    status: backup.status,
    storageObjectKey: backup.storageObjectKey,
    fileSizeBytes: backup.fileSizeBytes,
    requestedAt: backup.requestedAt,
    startedAt: backup.startedAt,
    completedAt: backup.completedAt,
    errorMessage: backup.errorMessage || null,
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `centyzz-backup-job-${backup.id}-manifest.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function BackupDetails({ backup, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  return <dialog className="sa-backup-dialog" ref={dialog} onClose={onClose} aria-labelledby="backup-details-title">
    <div className="sa-dialog-heading"><span className="sa-setting-icon"><FileArchive size={21} /></span><div><h2 id="backup-details-title">Backup job details</h2><p>Verified metadata from your database.</p></div><button type="button" className="sa-icon-button" aria-label="Close backup details" onClick={() => dialog.current?.close()}><X size={18} /></button></div>
    <dl className="sa-backup-details">
      <div><dt>Backup file</dt><dd>{backup.name}</dd></div>
      <div><dt>Requested</dt><dd>{formatDate(backup.requestedAt)}</dd></div>
      <div><dt>Started</dt><dd>{formatDate(backup.startedAt)}</dd></div>
      <div><dt>Completed</dt><dd>{formatDate(backup.completedAt)}</dd></div>
      <div><dt>Size</dt><dd>{formatSize(backup.sizeBytes)}</dd></div>
      <div><dt>Status</dt><dd>{backup.status}</dd></div>
      <div><dt>Storage object</dt><dd>{backup.storageObjectKey || 'Not stored yet'}</dd></div>
      {backup.errorMessage && <div><dt>Recorded failure</dt><dd>{backup.errorMessage}</dd></div>}
    </dl>
    <p className="sa-bypass-note"><Info size={15} />A manifest contains job details, not the database dump itself. Database restoration is not available from this screen.</p>
    <button type="button" className="sa-primary-button" onClick={() => downloadManifest(backup)}><Download size={15} />Download job manifest</button>
  </dialog>;
}

function PinDialog({ action, busy, error, onConfirm, onClose }) {
  const dialog = useRef(null);
  const [pin, setPin] = useState('');
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  return <dialog className="sa-backup-dialog" ref={dialog} aria-labelledby="settings-pin-title" onCancel={event => { if (busy) event.preventDefault(); else onClose(); }}>
    <form onSubmit={event => { event.preventDefault(); onConfirm(pin); }}>
      <div className="sa-dialog-heading"><span className="sa-setting-icon"><ShieldCheck size={20} /></span><div><h2 id="settings-pin-title">Confirm {action === 'backup' ? 'database backup' : action === 'download' ? 'backup download' : 'maintenance settings'}</h2><p>Enter your Superadmin management PIN to authorize this change.</p></div><button type="button" disabled={busy} className="sa-icon-button" aria-label="Cancel" onClick={onClose}><X size={18} /></button></div>
      <label className="sa-setting-field" style={{ marginTop: 20 }}>Six-digit management PIN<input type="password" autoComplete="off" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={pin} onChange={event => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))} style={{ padding: 12, borderRadius: 10, background: 'var(--workspace-subtle)', border: '1px solid var(--workspace-border)', color: 'var(--workspace-text)' }} /></label>
      {error && <p className="sa-api-error" role="alert">{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}><button type="button" className="sa-button" disabled={busy} onClick={onClose}>Cancel</button><button type="submit" className="sa-primary-button" disabled={busy || pin.length !== 6}>{busy ? 'Processing…' : 'Confirm'}</button></div>
    </form>
  </dialog>;
}

function FeedbackDialog({ title, message, onClose }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.showModal(); return () => ref.current?.close(); }, []);
  return <dialog className="sa-backup-dialog" ref={ref} aria-label={title} onCancel={onClose}>
    <div className="sa-dialog-heading"><span className="sa-setting-icon sa-success-icon"><Check size={24}/></span><div><h2>{title}</h2><p>Superadmin Settings</p></div><button type="button" className="sa-icon-button" aria-label="Close" onClick={onClose}><X size={18}/></button></div>
    <p className="sa-feedback-message">{message}</p>
    <button type="button" className="sa-primary-button" onClick={onClose}>Okay</button>
  </dialog>;
}

export default function SuperAdminSettings({ currentUser, maintenance: sharedMaintenance, onSaveMaintenance }) {
  const token = currentUser?.accessToken;
  const [maintenance, setMaintenance] = useState(sharedMaintenance || DEFAULT_MAINTENANCE);
  const [draft, setDraft] = useState(sharedMaintenance || DEFAULT_MAINTENANCE);
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [managerOpen, setManagerOpen] = useState(false);
  const [downloadTarget, setDownloadTarget] = useState(null);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [pending, setPending] = useState(null);
  const [pendingBusy, setPendingBusy] = useState(false);
  const [pinError, setPinError] = useState('');

  const loadBackups = useCallback(async () => {
    if (!token) return;
    setHistoryLoading(true);
    try {
      const response = await settingsRequest('/api/superadmin/settings/db-backups', token);
      setBackups(normalizeJobs(response.data));
    } finally { setHistoryLoading(false); }
  }, [token]);

  useEffect(() => {
    let active = true;
    if (!token) { setLoading(false); setError('Sign in to a Superadmin account to manage live settings.'); return; }
    setLoading(true);
    setError('');
    Promise.all([
      settingsRequest('/api/superadmin/settings/maintenance', token),
      settingsRequest('/api/superadmin/settings/db-backups', token),
    ]).then(([settings, history]) => {
      if (!active) return;
      if (!settings.data) throw new Error('Maintenance settings were not returned.');
      setMaintenance(settings.data);
      setDraft(settings.data);
      onSaveMaintenance?.(settings.data);
      setBackups(normalizeJobs(history.data));
    }).catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // onSaveMaintenance is a layout callback, intentionally not a reload trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const dirty = draft.enabled !== maintenance.enabled || draft.message !== maintenance.message || draft.duration !== maintenance.duration;
  const completed = backups.filter(row => row.status === 'COMPLETED');
  const latest = completed[0];
  const storedBytes = completed.reduce((sum, row) => sum + (Number(row.sizeBytes) || 0), 0);

  async function downloadBackup(backup, pin) {
    // Blob downloads over this size can exhaust memory on ordinary browsers.
    if (Number(backup.sizeBytes) > 100 * 1024 * 1024) {
      throw new Error('For backups over 100 MB, use your configured storage console to avoid excessive browser memory use.');
    }
    const result = await fetch(`/api/superadmin/settings/backups/${encodeURIComponent(backup.id)}/download`, {
      headers: { Authorization: `Bearer ${token}`, 'x-management-pin': pin },
    });
    if (!result.ok) {
      const body = await result.json().catch(() => ({}));
      throw new Error(body.message || `Backup download failed (${result.status})`);
    }
    const blob = await result.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `centyzz-backup-job-${backup.id}.dump`;
    document.body.appendChild(a); a.click(); a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  async function confirmPin(pin) {
    if (!/^\d{6}$/.test(pin) || !pending || pendingBusy) return;
    const action = pending;
    setPinError(''); setPendingBusy(true); setError(''); setNotice('');
    try {
      if (action === 'download') {
        if (!downloadTarget) throw new Error('Select a backup first');
        await downloadBackup(downloadTarget, pin);
        setFeedback({ title: 'Backup download ready', message: 'The verified PostgreSQL database dump was downloaded.' });
        setDownloadTarget(null);
      } else if (action === 'backup') {
        const response = await settingsRequest('/api/superadmin/settings/db-backup', token, { method: 'POST', pin });
        if (!response.success) throw new Error('Backup operation did not report success.');
        await loadBackups();
        setFeedback({ title: 'Database backup successful', message: 'A verified database dump was uploaded to your configured storage and recorded in Neon.' });
      } else {
        const response = await settingsRequest('/api/superadmin/settings/maintenance', token, {
          method: 'PATCH', pin,
          body: { enabled: draft.enabled, message: draft.message.trim(), duration: draft.duration },
        });
        if (!response?.data) throw new Error('The server did not return the saved maintenance settings.');
        setMaintenance(response.data);
        setDraft(response.data);
        onSaveMaintenance?.(response.data);
        setFeedback({ title: response.data.enabled ? 'Maintenance mode successfully turned on' : 'Maintenance mode successfully turned off', message: response.data.enabled ? `Admin, Staff and Customer access is restricted. Expected duration: ${response.data.duration}.` : 'Access to Admin, Staff and Customer workspaces has been restored.' });
      }
      setPending(null);
    } catch (err) { setPinError(err.message); }
    finally { setPendingBusy(false); }
  }

  return <>
    <SuperAdminHeader title="System settings" description="Manage database backup jobs and persistent maintenance configuration." />
    <div className="sa-preview-notice"><Info size={17} /><p><strong>Live database settings</strong> Backup history is read from Neon. A backup requires server-side PostgreSQL tools and S3 storage to be configured. Maintenance mode blocks authenticated non-Superadmin portals and protected APIs.</p></div>
    {loading && <div className="sa-settings-notice" role="status">Loading settings from Neon…</div>}
    {error && <div className="sa-api-error" role="alert">{error} <button type="button" onClick={() => window.location.reload()}>Retry</button></div>}
    {notice && <div className="sa-settings-notice" role="status"><Check size={16} />{notice}<button type="button" className="sa-icon-button" aria-label="Dismiss message" onClick={() => setNotice('')}><X size={15} /></button></div>}

    <div className="sa-settings-grid">
      <section className="sa-card sa-settings-panel" aria-labelledby="database-management-title">
        <div className="sa-setting-heading"><span className="sa-setting-icon"><Database size={21} /></span><div><h2 id="database-management-title">Database Management</h2><p>Verified backup jobs, recovery metadata, and storage.</p></div><span className="sa-state-pill">Neon data</span></div>
        <div className="sa-backup-summary"><div><span>Completed backups</span><strong>{loading ? '—' : completed.length}</strong><small>Among the latest {backups.length} jobs</small></div><div><span>Latest successful backup</span><strong className="sa-backup-date">{latest ? formatDate(latest.completedAt || latest.requestedAt).split(',')[0] : '—'}</strong><small>{latest ? formatDate(latest.completedAt || latest.requestedAt) : 'No completed backups'}</small></div></div>
        <div className="sa-storage-heading"><span><HardDrive size={15} />Stored backup size (loaded history)</span><b>{formatSize(storedBytes)}</b></div>
        <dl className="sa-settings-details"><div><dt>Backup format</dt><dd>PostgreSQL custom dump (.dump)</dd></div><div><dt>Recovery access</dt><dd>Superadmin only</dd></div><div><dt>Storage</dt><dd>S3-compatible object storage; database metadata in Neon</dd></div></dl>
        <button type="button" className="sa-primary-button" disabled={loading || !token} onClick={() => setManagerOpen(true)}><Database size={16} />Manage database</button>
      </section>

      <section className="sa-card sa-settings-panel" aria-labelledby="maintenance-mode-title">
        <form onSubmit={event => { event.preventDefault(); setPinError(''); setPending('maintenance'); }}>
          <div className="sa-setting-heading"><span className="sa-setting-icon"><Wrench size={21} /></span><div><h2 id="maintenance-mode-title">Maintenance Mode</h2><p>Save the maintenance notice and planned duration.</p></div><button type="button" className="sa-maintenance-switch" disabled={loading || Boolean(error)} role="switch" aria-label="Configure maintenance mode" aria-checked={Boolean(draft.enabled)} onClick={() => setDraft(value => ({ ...value, enabled: !value.enabled }))}><span /></button></div>
          <div className="sa-maintenance-state"><span className={`sa-state-pill${draft.enabled ? ' is-warning' : ''}`}>{draft.enabled ? 'Maintenance configured on' : 'Maintenance configured off'}</span>{dirty && <small>Unsaved configuration</small>}</div>
          <label className="sa-setting-field">Visitor message<textarea rows={2} maxLength={200} required value={draft.message} onChange={event => setDraft(value => ({ ...value, message: event.target.value }))} disabled={loading || Boolean(error)} /></label>
          <label className="sa-setting-field">Expected duration<select value={draft.duration} onChange={event => setDraft(value => ({ ...value, duration: event.target.value }))} disabled={loading || Boolean(error)}>{DURATIONS.map(duration => <option key={duration}>{duration}</option>)}</select></label>
          <div className="sa-maintenance-portals"><span>Maintenance enforcement scope</span><div><span>Customer portal</span><span>Staff workspace</span><span>Admin workspace</span></div></div>
          <p className="sa-bypass-note"><ShieldCheck size={15} />Admin, Staff, and Customer sessions are restricted while maintenance is enabled. Superadmin stays available.</p>
          <div className="sa-maintenance-save"><span><Clock3 size={13} />{maintenance.updatedAt ? `Saved ${formatDate(maintenance.updatedAt)}` : 'No changes recorded yet'}</span><button type="submit" className="sa-primary-button" disabled={!dirty || loading || Boolean(error)}><Check size={15} />Save settings</button></div>
        </form>
      </section>
    </div>

    <section className="sa-card sa-audit sa-backup-history" aria-labelledby="backup-history-title">
      <div className="sa-audit-heading"><div><h2 id="backup-history-title">Backup history</h2><p>Database-backed jobs. The status shows whether a real backup completed.</p></div><div className="sa-audit-actions"><span className="sa-state-pill">{backups.length} jobs</span><button type="button" className="sa-button" disabled={historyLoading || !token} onClick={() => loadBackups().catch(err => setError(err.message))}><RefreshCw size={15} />{historyLoading ? 'Refreshing…' : 'Refresh'}</button></div></div>
      <div className="sa-table-scroll" role="region" aria-label="Backup history table" tabIndex={0}><table className="sa-table"><thead><tr><th>Backup job/file</th><th>Requested</th><th>Type</th><th>Size</th><th>Status</th><th><span className="sa-visually-hidden">Actions</span></th></tr></thead><tbody>{backups.map(backup => <tr key={backup.id}><td><span className="sa-backup-file"><FileArchive size={17} /><strong title={backup.name}>{backup.name}</strong></span></td><td>{formatDate(backup.requestedAt)}</td><td>Database</td><td>{formatSize(backup.sizeBytes)}</td><td><span className={`sa-state-pill${backup.status === 'FAILED' ? ' is-warning' : ''}`}>{backup.status}</span></td><td><button type="button" className="sa-text-button" onClick={() => setSelectedBackup(backup)} aria-label={`View details for ${backup.name}`}>Details</button></td></tr>)}</tbody></table>{!loading && backups.length === 0 && <div className="sa-empty">No backup jobs have been recorded yet.</div>}</div>
    </section>
    {selectedBackup && <BackupDetails backup={selectedBackup} onClose={() => setSelectedBackup(null)} />}
    {managerOpen && <SuperadminBackupManager backups={backups} busy={historyLoading || pendingBusy || loading} onRefresh={() => loadBackups().catch(err => setError(err.message))} onCreate={() => { setManagerOpen(false); setPinError(''); setPending('backup'); }} onDownload={backup => { setDownloadTarget(backup); setManagerOpen(false); setPinError(''); setPending('download'); }} onClose={() => setManagerOpen(false)} />}
    {feedback && <FeedbackDialog {...feedback} onClose={() => setFeedback(null)} />}
    {pending && <PinDialog key={pending} action={pending} busy={pendingBusy} error={pinError} onClose={() => { if (!pendingBusy) { setPending(null); setPinError(''); } }} onConfirm={confirmPin} />}
  </>;
}
