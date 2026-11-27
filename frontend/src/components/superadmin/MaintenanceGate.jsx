import { Clock3, ShieldCheck, Sparkles, Wrench } from 'lucide-react';

/** Shown only to authenticated non-Superadmin users. */
export default function MaintenanceGate({ status, checking, onSignOut }) {
  if (checking) return <main className="sa-loading-screen" role="status" aria-live="polite" aria-label="Loading your salon workspace">
    <div className="sa-loading-glow sa-loading-glow-one" aria-hidden="true" />
    <div className="sa-loading-glow sa-loading-glow-two" aria-hidden="true" />
    <section className="sa-loading-content">
      <div className="sa-loading-logo-wrap">
        <span className="sa-loading-ring" aria-hidden="true" />
        <img className="sa-loading-logo" src="/logo.png" alt="Centy’zz Hair & Beauty" />
        <Sparkles className="sa-loading-sparkle" size={19} aria-hidden="true" />
      </div>
      <p className="sa-loading-eyebrow">CENTY’ZZ HAIR & BEAUTY</p>
      <h1>Preparing your workspace</h1>
      <p className="sa-loading-message">Checking salon access and getting things ready…</p>
      <div className="sa-loading-progress" aria-hidden="true"><span /></div>
    </section>
  </main>;

  return <div className="sa-maintenance-gate">
    <section className="sa-maintenance-gate-card" role="status" aria-live="polite">
      <div className="sa-maintenance-gate-mark"><Wrench size={32} /></div>
      <p className="sa-maintenance-gate-eyebrow">CENTY'ZZ HAIR & BEAUTY · SERVICE NOTICE</p>
      <h1>We're under maintenance</h1>
      <p className="sa-maintenance-gate-message">{status?.message || 'We are making improvements and will be back shortly.'}</p>
      <p className="sa-maintenance-gate-duration"><Clock3 size={18} /> Estimated maintenance duration: <strong>{status?.duration || 'Not specified'}</strong></p>
      <p className="sa-maintenance-gate-sub"><ShieldCheck size={16} /> Access will resume after the Superadmin disables maintenance mode. This estimate is not a live countdown.</p>
      <button type="button" className="sa-maintenance-gate-signout" onClick={onSignOut}>Sign out</button>
    </section>
  </div>;
}
