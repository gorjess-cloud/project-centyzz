import { useEffect, useRef, useState } from 'react';
import { Check, Clock3, Database, Download, FileArchive, HardDrive, Info, Plus, ShieldCheck, Wrench, X } from 'lucide-react';
import SuperAdminHeader from './SuperAdminHeader';
import { createPreviewBackups } from './superadminPreviewData';

const backupsKey = 'centyzz-backups-ui-preview';
const formatDate = value => new Date(value).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
const formatSize = value => value >= 1024 ? `${(value / 1024).toFixed(2)} GB` : `${value} MB`;

function readBackups() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(backupsKey));
    if (Array.isArray(saved) && saved.length && saved.every(item => item.id && item.name && Number.isFinite(item.sizeMb) && !Number.isNaN(Date.parse(item.createdAt)))) return saved;
  } catch { /* Start a fresh preview when browser storage is unavailable. */ }
  return createPreviewBackups();
}

function BackupDetails({ backup, onClose }) {
  const dialog = useRef(null);
  useEffect(() => { dialog.current?.showModal(); }, []);

  function downloadManifest() {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ preview: true, ...backup }, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${backup.id}-sample-manifest.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return <dialog className="sa-backup-dialog" ref={dialog} onClose={onClose} aria-labelledby="backup-details-title">
    <div className="sa-dialog-heading"><span className="sa-setting-icon"><FileArchive size={21} /></span><div><h2 id="backup-details-title">Backup preview details</h2><p>Example backup metadata for this interface.</p></div><button type="button" className="sa-icon-button" aria-label="Close backup details" onClick={() => dialog.current.close()}><X size={18} /></button></div>
    <dl className="sa-backup-details"><div><dt>File name</dt><dd>{backup.name}</dd></div><div><dt>Created</dt><dd>{formatDate(backup.createdAt)}</dd></div><div><dt>Example size</dt><dd>{formatSize(backup.sizeMb)}</dd></div><div><dt>Backup type</dt><dd>{backup.type}</dd></div><div><dt>Contents</dt><dd>Sample metadata only</dd></div><div><dt>Status</dt><dd>{backup.status}</dd></div></dl>
    <button type="button" className="sa-primary-button" onClick={downloadManifest}><Download size={15} />Download sample manifest</button>
  </dialog>;
}

export default function SuperAdminSettings({ maintenance, onSaveMaintenance }) {
  const [backups, setBackups] = useState(readBackups);
  const [draft, setDraft] = useState(maintenance);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [notice, setNotice] = useState('');
  const storageUsed = backups.reduce((sum, backup) => sum + backup.sizeMb, 0);
  const storageLimit = 2048;
  const dirty = draft.enabled !== maintenance.enabled || draft.message !== maintenance.message || draft.duration !== maintenance.duration;

  function createBackupPreview() {
    const now = new Date();
    const backup = { id: `sample-backup-${now.getTime()}`, name: `centyzz-manual-${now.toISOString().replace(/[:.]/g, '-')}.backup`, createdAt: now.toISOString(), sizeMb: 148, type: 'Manual', status: 'Preview ready' };
    const next = [backup, ...backups];
    setBackups(next);
    try { sessionStorage.setItem(backupsKey, JSON.stringify(next)); } catch { /* Keep the preview available in memory. */ }
    setNotice('A sample backup was added to this preview.');
  }

  function saveMaintenance(event) {
    event.preventDefault();
    const next = { ...draft, updatedAt: new Date().toISOString() };
    onSaveMaintenance(next);
    setDraft(next);
    setNotice('Maintenance settings were saved for this preview session.');
  }

  return <>
    <SuperAdminHeader title="System settings" description="Manage database backups and plan system maintenance." />
    <div className="sa-preview-notice"><Info size={17} /><p><strong>Interface preview</strong> Try backup and maintenance settings here. Changes apply only to this browser session.</p></div>
    {notice && <div className="sa-settings-notice" role="status"><Check size={16} />{notice}<button type="button" className="sa-icon-button" aria-label="Dismiss message" onClick={() => setNotice('')}><X size={15} /></button></div>}

    <div className="sa-settings-grid">
      <section className="sa-card sa-settings-panel" aria-labelledby="database-management-title">
        <div className="sa-setting-heading"><span className="sa-setting-icon"><Database size={21} /></span><div><h2 id="database-management-title">Database Management</h2><p>Backup history, recovery files, and storage.</p></div><span className="sa-state-pill">Preview data</span></div>
        <div className="sa-backup-summary"><div><span>Backup previews</span><strong>{backups.length}</strong><small>Available in this session</small></div><div><span>Latest backup</span><strong className="sa-backup-date">{new Date(backups[0].createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</strong><small>{new Date(backups[0].createdAt).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })}</small></div></div>
        <div className="sa-storage-heading"><span><HardDrive size={15} />Example storage allocation</span><b>{formatSize(storageUsed)} / 2 GB</b></div>
        <div className="sa-progress-track" role="meter" aria-label="Preview backup storage" aria-valuemin={0} aria-valuemax={storageLimit} aria-valuenow={Math.min(storageUsed, storageLimit)}><span style={{ width: `${Math.min(100, storageUsed / storageLimit * 100)}%` }} /></div>
        <dl className="sa-settings-details"><div><dt>Backup format</dt><dd>PostgreSQL backup</dd></div><div><dt>Recovery access</dt><dd>Superadmin only</dd></div><div><dt>Backup coverage</dt><dd>Accounts, bookings & system records</dd></div></dl>
        <button type="button" className="sa-primary-button" onClick={createBackupPreview}><Plus size={16} />Create backup preview</button>
      </section>

      <section className="sa-card sa-settings-panel" aria-labelledby="maintenance-mode-title">
        <form onSubmit={saveMaintenance}>
          <div className="sa-setting-heading"><span className="sa-setting-icon"><Wrench size={21} /></span><div><h2 id="maintenance-mode-title">Maintenance Mode</h2><p>Prepare a temporary service interruption.</p></div><button type="button" className="sa-maintenance-switch" role="switch" aria-label="Preview maintenance mode" aria-checked={draft.enabled} onClick={() => setDraft({ ...draft, enabled: !draft.enabled })}><span /></button></div>
          <div className="sa-maintenance-state"><span className={`sa-state-pill${draft.enabled ? ' is-warning' : ''}`}>{draft.enabled ? 'Maintenance preview enabled' : 'Operational preview'}</span>{dirty && <small>Unsaved preview changes</small>}</div>
          <label className="sa-setting-field">Visitor message<textarea rows={2} maxLength={200} required value={draft.message} onChange={event => setDraft({ ...draft, message: event.target.value })} /></label>
          <label className="sa-setting-field">Expected duration<select value={draft.duration} onChange={event => setDraft({ ...draft, duration: event.target.value })}><option>30 minutes</option><option>1 hour</option><option>2 hours</option><option>4 hours</option></select></label>
          <div className="sa-maintenance-portals"><span>Affected portals</span><div><span>Customer portal</span><span>Staff workspace</span><span>Admin workspace</span></div></div>
          <p className="sa-bypass-note"><ShieldCheck size={15} />Superadmin access stays available during the planned window.</p>
          <div className="sa-maintenance-save"><span><Clock3 size={13} />{maintenance.updatedAt ? `Preview saved ${new Date(maintenance.updatedAt).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })}` : 'No preview changes saved'}</span><button type="submit" className="sa-primary-button" disabled={!dirty}><Check size={15} />Save preview</button></div>
        </form>
      </section>
    </div>

    <section className="sa-card sa-audit sa-backup-history" aria-labelledby="backup-history-title">
      <div className="sa-audit-heading"><div><h2 id="backup-history-title">Backup history</h2><p>Example recovery files for the database management interface.</p></div><span className="sa-state-pill">{backups.length} previews</span></div>
      <div className="sa-table-scroll" role="region" aria-label="Backup history table; scroll horizontally for more columns" tabIndex={0}><table className="sa-table"><thead><tr><th>Backup file</th><th>Created</th><th>Type</th><th>Size</th><th>Status</th><th><span className="sa-visually-hidden">Actions</span></th></tr></thead><tbody>{backups.map(backup => <tr key={backup.id}><td><span className="sa-backup-file"><FileArchive size={17} /><strong title={backup.name}>{backup.name}</strong></span></td><td>{formatDate(backup.createdAt)}</td><td>{backup.type}</td><td>{formatSize(backup.sizeMb)}</td><td><span className="sa-state-pill">{backup.status}</span></td><td><button type="button" className="sa-text-button" onClick={() => setSelectedBackup(backup)} aria-label={`View details for ${backup.name}`}>Details</button></td></tr>)}</tbody></table></div>
    </section>
    {selectedBackup && <BackupDetails backup={selectedBackup} onClose={() => setSelectedBackup(null)} />}
  </>;
}
