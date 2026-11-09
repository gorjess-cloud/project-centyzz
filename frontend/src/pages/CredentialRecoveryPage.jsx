import PasswordRequirements, { passwordRequirements } from '../components/PasswordRequirements';
import { useEffect, useState } from 'react';
import { KeyRound, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export default function CredentialRecoveryPage({ initialHash }) {
  const [link] = useState(() => {
    const match = /^#\/recover\/(password|pin)\?(.+)$/.exec(initialHash);
    return { kind: match?.[1], token: new URLSearchParams(match?.[2] || '').get('token') || '' };
  });
  const [value,setValue] = useState('');
  const [confirmation,setConfirmation] = useState('');
  const [showValue,setShowValue] = useState(false);
  const [showConfirmation,setShowConfirmation] = useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [done,setDone] = useState(false);
  const pin = link.kind === 'pin';
  const label = pin ? 'PIN' : 'password';
  const requirementsMet = pin
    ? /^\d{6}$/.test(value) && !/^(\d)\1{5}$/.test(value) && !['123456','654321'].includes(value)
    : passwordRequirements(value).every(rule => rule.met);
  const confirmationMatches = confirmation.length > 0 && value === confirmation;
  const valid = ['password','pin'].includes(link.kind) && /^[A-Za-z0-9_-]{43}$/.test(link.token);
  useEffect(() => {
    // Keep the bearer token out of browser history, referrers, and copied page addresses.
    window.history.replaceState(null,'',window.location.pathname + window.location.search);
    const meta = document.createElement('meta');meta.name='referrer';meta.content='no-referrer';document.head.appendChild(meta);
    return () => meta.remove();
  },[]);
  async function submit(event) {
    event.preventDefault();if(busy)return;
    setError('');
    if(value !== confirmation){setError('The confirmation does not match.');return;}
    if(!requirementsMet) {
      setError(pin ? 'Use six nontrivial digits.' : 'Use 12–128 characters with upper/lowercase letters, a number and a symbol.');return;
    }
    setBusy(true);
    try {
      const response=await fetch('/api/admin/credential-recovery/complete',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({kind:link.kind,token:link.token,newValue:value,confirmValue:confirmation}),
      });
      const result=await response.json();
      if(!response.ok)throw Error(Array.isArray(result.message)?result.message.join(' '):result.message || 'Unable to complete the reset.');
      setValue('');setConfirmation('');setDone(true);
    }catch(err){setError(err.message || 'Unable to reach the server. Please try again.');}
    finally{setBusy(false);}
  }
  return <main className="min-h-screen bg-[#F6F4EF] flex items-center justify-center p-5 text-[#2A1E1B]">
    <section className="w-full max-w-md bg-white rounded-2xl border border-[#E7DFD4] p-8 shadow-sm">
      <p className="text-xs font-bold tracking-widest text-[#8B5E3C] mb-6">CENTYZZ HAIR &amp; BEAUTY</p>
      {done ? <><CheckCircle2 className="text-green-700 mb-4" size={32}/><h1 className="text-2xl font-bold">{pin?'PIN':'Password'} updated</h1>
        <p className="mt-3 text-sm text-[#736457]">Your reset link has been used. Sign in again with your updated credentials.</p></>
      : <><KeyRound className="text-[#8B5E3C] mb-4" size={28}/><h1 className="text-2xl font-bold">Reset your {label}</h1>
        <p className="mt-3 mb-6 text-sm text-[#736457]">Choose your new {label}. This email link expires after 15 minutes and works once.</p>
        {!valid ? <p role="alert" className="text-sm text-red-700">This reset link is incomplete or invalid. Open the full link from your email or ask your administrator for a new one.</p>
        : <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="new-credential" className="block text-sm font-semibold">New {label}</label>
            <div className="relative mt-2">
              <input id="new-credential" autoFocus type={showValue?'text':'password'} inputMode={pin?'numeric':undefined}
                autoComplete="new-password" aria-describedby={pin?undefined:'password-requirements'} maxLength={pin?6:128} required value={value}
                onChange={e=>setValue(pin?e.target.value.replace(/\D/g,''):e.target.value)}
                className="block w-full p-3 pr-12 border border-[#D9CEBE] rounded-lg focus:outline-[#8B5E3C]" />
              <button type="button" aria-label={`${showValue?'Hide':'Show'} new ${label}`} aria-pressed={showValue}
                onClick={()=>setShowValue(shown=>!shown)} className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-[#8B5E3C] rounded-md hover:bg-[#F8F5F0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8B5E3C]">
                {showValue?<EyeOff size={18} aria-hidden="true" />:<Eye size={18} aria-hidden="true" />}
              </button>
            </div>
          </div>
          <p className="text-xs text-[#736457]" hidden={!pin}>Six digits. Avoid repeated digits, 123456 and 654321.</p>
          {!pin && <PasswordRequirements value={value} />}
          <div>
            <label htmlFor="confirm-credential" className="block text-sm font-semibold">Confirm new {label}</label>
            <div className="relative mt-2">
              <input id="confirm-credential" type={showConfirmation?'text':'password'} inputMode={pin?'numeric':undefined}
                autoComplete="new-password" maxLength={pin?6:128} required value={confirmation}
                onChange={e=>setConfirmation(pin?e.target.value.replace(/\D/g,''):e.target.value)}
                className="block w-full p-3 pr-12 border border-[#D9CEBE] rounded-lg focus:outline-[#8B5E3C]" />
              <button type="button" aria-label={`${showConfirmation?'Hide':'Show'} confirmed ${label}`} aria-pressed={showConfirmation}
                onClick={()=>setShowConfirmation(shown=>!shown)} className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-[#8B5E3C] rounded-md hover:bg-[#F8F5F0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8B5E3C]">
                {showConfirmation?<EyeOff size={18} aria-hidden="true" />:<Eye size={18} aria-hidden="true" />}
              </button>
            </div>
          </div>
          {confirmation.length > 0 && <p aria-live="polite" className={`flex items-center gap-1.5 text-xs ${confirmationMatches ? 'text-emerald-700' : 'text-rose-700'}`}>
            {confirmationMatches && <CheckCircle2 size={14} aria-hidden="true" />}
            {confirmationMatches ? (pin ? 'PINs match' : 'Passwords match') : (pin ? 'PINs do not match yet' : 'Passwords do not match yet')}
          </p>}
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button disabled={busy || !requirementsMet || !confirmationMatches} className="w-full rounded-lg bg-[#8B5E3C] text-white p-3 font-semibold disabled:opacity-50">{busy?'Updating…':`Reset ${label}`}</button>
        </form>}</>}
      <a href="/" className="block mt-6 text-sm font-semibold text-[#8B5E3C] underline">Back to salon</a>
    </section>
  </main>;
}
