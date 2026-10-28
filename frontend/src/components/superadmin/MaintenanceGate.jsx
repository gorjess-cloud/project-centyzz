import { Clock3, ShieldCheck, Wrench } from 'lucide-react';

/** Shown only to authenticated non-Superadmin users. */
export default function MaintenanceGate({ status, checking, onSignOut }) {
  return <div className="sa-maintenance-gate">
    <section className="sa-maintenance-gate-card" role="status" aria-live="polite">
      <div className="sa-maintenance-gate-mark"><Wrench size={32} /></div>
      <p className="sa-maintenance-gate-eyebrow">CENTY'ZZ HAIR & BEAUTY · SERVICE NOTICE</p>
      <h1>{checking ? 'Checking salon availability…' : "We're under maintenance"}</h1>
      <p className="sa-maintenance-gate-message">{checking ? 'Checking the latest system configuration.' : status?.message || 'We are making improvements and will be back shortly.'}</p>
      {!checking && <p className="sa-maintenance-gate-duration"><Clock3 size={18} /> Estimated maintenance duration: <strong>{status?.duration || 'Not specified'}</strong></p>}
      <p className="sa-maintenance-gate-sub"><ShieldCheck size={16} /> Access will resume after the Superadmin disables maintenance mode. This estimate is not a live countdown.</p>
      <button type="button" className="sa-maintenance-gate-signout" onClick={onSignOut}>Sign out</button>
    </section>
  </div>;
}
