import { useEffect, useRef, useState } from 'react';
import { ArchiveRestore, Clock3, Cloud, Database, Download, FileArchive, HardDrive, Info, RefreshCw, Settings2, Trash2, X } from 'lucide-react';

const fmtDate = value => value && !Number.isNaN(Date.parse(value)) ? new Date(value).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const fmtBytes = value => value == null ? '—' : Number(value) >= 1024 ** 3 ? `${(Number(value)/1024**3).toFixed(2)} GB` : `${(Number(value)/1024**2).toFixed(2)} MB`;

function Dialog({ title, subtitle, children, onClose, wide = false, footer }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.showModal(); return () => ref.current?.close(); }, []);
  return <dialog ref={ref} className={wide ? 'sa-manager-dialog' : 'sa-backup-dialog'} onCancel={onClose} aria-label={title}>
    <div className="sa-manager-pad">
      <div className="sa-manager-head"><span className="sa-setting-icon"><Database size={21}/></span><div><h2>{title}</h2><p>{subtitle}</p></div><button type="button" className="sa-icon-button" onClick={onClose} aria-label="Close"><X size={18}/></button></div>
      {children}
    </div>
    {footer && <div className="sa-manager-footer">{footer}</div>}
  </dialog>;
}

export default function SuperadminBackupManager({ backups, busy, onRefresh, onCreate, onDownload, onClose }) {
  const [selected, setSelected] = useState(backups.find(item => item.status === 'COMPLETED')?.id || null);
  const [subpage, setSubpage] = useState('manage');
  const completed = backups.filter(b => b.status === 'COMPLETED');
  const storedBytes = completed.reduce((sum, row) => sum + (Number(row.sizeBytes) || 0), 0);
  const latest = completed[0];
  const selectedBackup = backups.find(b => b.id === selected) || null;
  const size = fmtBytes(storedBytes);
  const hasRunning = backups.some(b => ['PENDING', 'RUNNING'].includes(b.status));
  const title = subpage === 'manage' ? 'Manage Backups' : subpage === 'restore' ? 'Restore from Backup' : 'Backup Settings';
  const subtitle = subpage === 'manage' ? 'Create, inspect, and securely download verified database backups.' : subpage === 'restore' ? 'Review a backup before planning a database recovery.' : 'Backup frequency, storage, and retention settings.';
  return <Dialog wide title={title} subtitle={subtitle} onClose={onClose} footer={<>
    {subpage !== 'manage' && <button type="button" className="sa-button" onClick={() => setSubpage('manage')}>Back to backups</button>}
    <button type="button" className="sa-primary-button" onClick={onClose}>Done</button>
  </>}>
    {subpage === 'manage' && <>
      <div className="sa-manager-stats">
        <div className="sa-manager-stat"><small>Total jobs (loaded)</small><strong>{backups.length}</strong></div>
        <div className="sa-manager-stat"><small>Stored backups</small><strong>{completed.length}</strong></div>
        <div className="sa-manager-stat"><small>Stored size (loaded)</small><strong>{size}</strong></div>
        <div className="sa-manager-stat"><small>Last successful backup</small><strong style={{fontSize:12}}>{fmtDate(latest?.completedAt)}</strong></div>
      </div>
      <section className="sa-manager-section"><div className="sa-manager-toolbar"><h3>Backup List</h3><div className="sa-manager-actions"><button type="button" className="sa-button" onClick={onRefresh} disabled={busy}><RefreshCw size={15}/> Refresh</button><button type="button" className="sa-primary-button" onClick={onCreate} disabled={busy || hasRunning}><Database size={15}/> Create backup</button></div></div>
        <div className="sa-manager-table-wrap"><table className="sa-manager-table"><thead><tr><th>Select</th><th>Backup name</th><th>Created</th><th>Type</th><th>Size</th><th>Status</th><th>Actions</th></tr></thead><tbody>{backups.map(backup => <tr key={backup.id}><td><input type="radio" name="backup-select" checked={selected===backup.id} onChange={() => setSelected(backup.id)} aria-label={`Select ${backup.name}`} /></td><td title={backup.name}>{backup.name}</td><td>{fmtDate(backup.requestedAt)}</td><td>Full</td><td>{fmtBytes(backup.sizeBytes)}</td><td>{backup.status}</td><td><div className="sa-manager-actions"><button type="button" disabled={backup.status!=='COMPLETED' || busy} onClick={() => onDownload(backup)} title="Download the actual database dump; management PIN required"><Download size={15}/> Download</button><button type="button" disabled title="Permanent deletion is disabled until retention policy and recovery safeguards are verified"><Trash2 size={15}/> Delete</button></div></td></tr>)}</tbody></table>{backups.length===0 && <p className="sa-manager-notice">No backup jobs have been recorded yet.</p>}</div>
      </section>
      <div className="sa-manager-selected"><FileArchive size={19}/> {selectedBackup ? <>Selected: <strong>{selectedBackup.name}</strong> · {selectedBackup.status} · {fmtBytes(selectedBackup.sizeBytes)}</> : 'Select a backup to inspect.'}</div>
      <div className="sa-manager-notice"><Info size={18}/> Backups are PostgreSQL custom dumps stored in configured S3-compatible storage. Only completed jobs with stored files can be downloaded. Full restore and permanent deletion require a separately tested disaster-recovery workflow.</div>
      <div className="sa-manager-actions" style={{justifyContent:'space-between',paddingTop:10}}><button type="button" className="sa-button" onClick={() => setSubpage('restore')}><ArchiveRestore size={16}/> Restore from Backup</button><button type="button" className="sa-button" onClick={() => setSubpage('settings')}><Settings2 size={16}/> Backup Settings</button></div>
    </>}
    {subpage === 'restore' && <>
      <div className="sa-manager-notice"><ArchiveRestore size={18}/> Database restoration can replace current records. This screen provides a safe review only; no restore operation will run on your live database.</div>
      <div className="sa-manager-table-wrap"><table className="sa-manager-table"><thead><tr><th>Select</th><th>Backup</th><th>Created</th><th>Size</th><th>Status</th></tr></thead><tbody>{completed.map(b=><tr key={b.id}><td><input type="radio" checked={selected===b.id} onChange={()=>setSelected(b.id)} name="restore-select" aria-label={`Select ${b.name}`}/></td><td>{b.name}</td><td>{fmtDate(b.requestedAt)}</td><td>{fmtBytes(b.sizeBytes)}</td><td>{b.status}</td></tr>)}</tbody></table></div>
      <section className="sa-manager-section"><h3>Selected Backup</h3><p style={{fontSize:12}}>{selectedBackup ? `${selectedBackup.name} · ${fmtBytes(selectedBackup.sizeBytes)} · ${fmtDate(selectedBackup.completedAt)}` : 'No backup selected.'}</p><p className="sa-manager-notice"><Info size={17}/> Restore is unavailable until we've verified backup integrity, a recovery environment, rollback procedures, and downtime controls.</p><button className="sa-primary-button" type="button" disabled title="Requires a tested recovery workflow">Restore Database (not available)</button></section>
    </>}
    {subpage === 'settings' && <>
      <section className="sa-manager-section"><h3>Automatic Backup</h3><div className="sa-manager-notice"><Clock3 size={17}/> Only manual backups are supported by the current backend. Automatic scheduling is not enabled.</div><div className="sa-manager-two-col"><label className="sa-manager-field">Backup frequency<select disabled defaultValue="Manual"><option>Manual</option><option>Daily</option><option>Weekly</option></select></label><label className="sa-manager-field">Backup time<input type="time" disabled defaultValue="01:00" /></label></div><label className="sa-manager-field">Backup type<select disabled defaultValue="Full"><option>Full</option><option>Incremental (not supported)</option></select></label></section>
      <section className="sa-manager-section"><h3>Storage Settings</h3><div className="sa-manager-two-col"><div><p className="sa-manager-field"><Cloud size={16}/> Storage location</p><strong style={{fontSize:12}}>S3-compatible object storage</strong></div><div><p className="sa-manager-field"><HardDrive size={16}/> Stored size (50 most recent jobs)</p><strong>{size}</strong><p style={{fontSize:11,color:'var(--workspace-muted)'}}>Storage quota is not reported by this backend.</p></div></div></section>
      <section className="sa-manager-section"><h3>Backup Retention</h3><label className="sa-manager-field">Keep backups for<select disabled defaultValue="Manual"><option>Manual</option><option>30 days</option><option>90 days</option></select></label><label className="sa-manager-field"><span>Automatic deletion of old backups is disabled until a verified retention process is in place.</span></label></section>
    </>}
  </Dialog>;
}
