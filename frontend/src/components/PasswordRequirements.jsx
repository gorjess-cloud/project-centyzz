import { Check, X } from 'lucide-react';

export function passwordRequirements(value) {
  return [
    { label: '12–128 characters', met: value.length >= 12 && value.length <= 128 },
    { label: 'At least one uppercase letter (A–Z)', met: /[A-Z]/.test(value) },
    { label: 'At least one lowercase letter (a–z)', met: /[a-z]/.test(value) },
    { label: 'At least one number (0–9)', met: /\d/.test(value) },
    { label: 'At least one symbol (!, @, #, etc.)', met: /[^A-Za-z0-9]/.test(value) },
  ];
}

export default function PasswordRequirements({ value }) {
  const rules = passwordRequirements(value);
  const count = rules.filter(rule => rule.met).length;
  const level = !value ? 0 : count === rules.length ? 3 : count >= 3 ? 2 : 1;
  const status = ['Not started', 'Low', 'Medium', 'High'][level];
  const color = ['text-[#736457]', 'text-rose-700', 'text-amber-700', 'text-emerald-700'][level];
  return <div id="password-requirements" className="rounded-xl border border-[#E9E2D6] bg-[#F8F5F0] p-4">
    <div className="flex items-center justify-between gap-3 text-xs mb-3">
      <span className="font-semibold text-[#736457]">Password requirements</span>
      <span aria-live="polite" className={`font-bold ${color}`}>{status}</span>
    </div>
    <div role="progressbar" aria-label="Password requirement progress" aria-valuemin={0} aria-valuemax={5}
      aria-valuenow={count} aria-valuetext={`${status}: ${count} of 5 requirements met`}
      className="grid grid-cols-3 gap-2 mb-4">
      {[1,2,3].map(segment => <span key={segment} className={`h-1.5 rounded-full transition-colors duration-200 ${
        level < segment ? 'bg-[#E5DED3]' : segment === 1 ? 'bg-rose-400' : segment === 2 ? 'bg-amber-500' : 'bg-emerald-500'
      }`} />)}
    </div>
    <ul className="space-y-2.5">
      {rules.map(rule => <li key={rule.label} className={`flex items-center gap-2.5 text-xs ${rule.met ? 'text-emerald-800' : 'text-[#736457]'}`}>
        <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${rule.met ? 'bg-emerald-100' : 'bg-white border border-[#E5DED3]'}`}>
          {rule.met ? <Check size={12} aria-hidden="true" /> : <X size={11} aria-hidden="true" />}
        </span>
        <span>{rule.label}<span className="sr-only">{rule.met ? ': met' : ': not yet met'}</span></span>
      </li>)}
    </ul>
  </div>;
}
