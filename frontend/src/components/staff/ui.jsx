import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, Inbox } from 'lucide-react';
import useModalScrollLock from '../../hooks/useModalScrollLock';

// Staff UI intentionally co-locates its existing formatting helpers.
// eslint-disable-next-line react-refresh/only-export-components
export const peso = (n) => '₱' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 });

const focus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059]/50';
export const card = 'rounded-2xl border border-[#E7DFD4] bg-[#FFFDF8] shadow-sm';
export const input = 'w-full rounded-xl border border-[#E7DFD4] bg-[#F8F5F0] px-3 py-2 text-xs text-[#2A1E1B] outline-none transition placeholder:text-[#8A8174]/70 focus:border-[#C5A059] focus:bg-white focus:ring-2 focus:ring-[#C5A059]/20 disabled:cursor-not-allowed read-only:text-[#5C5243]';
export const btn = `rounded-xl bg-[#4A3928] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#2A1E1B] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${focus}`;
export const btnGhost = `rounded-xl border border-[#E7DFD4] bg-white px-3 py-2 text-xs font-bold text-[#443523] transition hover:bg-[#F6F0E6] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${focus}`;

/* Keyframes used by .fade-in / .pop-in (rendered once by StaffLayout). Respects reduced motion. */
export function MotionStyles() {
  return (
    <style>{`
      @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
      @keyframes popIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:none}}
      .fade-in{animation:fadeIn .25s ease both}
      .pop-in{animation:popIn .18s ease both}
      @media (prefers-reduced-motion:reduce){.fade-in,.pop-in{animation:none}}
    `}</style>
  );
}

/* Auto-dismissing toast state: const [toast, say] = useToast(); say('Saved'); <Toast msg={toast} /> */
// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const [msg, setMsg] = useState('');
  const timer = useRef();
  const say = useCallback((m, ms = 3000) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(''), ms);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return [msg, say];
}

export function Toast({ msg }) {
  return (
    <div role="status" aria-live="polite">
      {msg && (
        <div className="pop-in fixed bottom-6 right-6 z-[100] flex max-w-[calc(100vw-3rem)] items-center gap-2.5 rounded-xl bg-[#2A1E1B] px-4 py-3 text-xs font-bold text-white shadow-xl">
          <CheckCircle2 size={16} className="shrink-0 text-[#C5A059]" />
          {msg}
        </div>
      )}
    </div>
  );
}

export function Header({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-[#2A1E1B]">{title}</h1>
        <p className="mt-0.5 text-xs text-[#8A8174]">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

const TONES = {
  ok: 'bg-emerald-50 text-emerald-700',
  bad: 'bg-rose-50 text-rose-700',
  gold: 'bg-[#EBDBC8] text-[#8C6D3B]',
  neutral: 'border border-[#E7DFD4] bg-[#F8F5F0] text-[#5C5243]',
};
export function Badge({ tone = 'neutral', children }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${TONES[tone]}`}>{children}</span>;
}

export function StatCard({ icon: Icon, label, value, tone = 'neutral' }) {
  const ring = tone === 'bad' ? 'bg-rose-50 text-rose-600' : 'bg-[#F6F0E6] text-[#8B5E3C]';
  return (
    <div className={`${card} flex items-center gap-4 p-4`}>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${ring}`}><Icon size={20} /></span>
      <div>
        <p className="text-2xl font-bold leading-none text-[#2A1E1B]">{value}</p>
        <p className="mt-1 text-[11px] font-medium text-[#8A8174]">{label}</p>
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, hint, children }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F6F0E6] text-[#8B5E3C]"><Icon size={28} strokeWidth={1.5} /></span>
      <p className="text-sm font-bold text-[#2A1E1B]">{title}</p>
      {hint && <p className="max-w-xs text-xs text-[#8A8174]">{hint}</p>}
      {children}
    </div>
  );
}

// Portals keep viewport overlays outside animated/scrolling Staff content.
export function StaffOverlay({children,onDismiss,layer=200}) {
  useModalScrollLock(true);
  return createPortal(<div data-staff-overlay className="fixed inset-0 flex min-h-dvh w-screen items-center justify-center overflow-y-auto bg-[#2A1E1B]/50 p-4 backdrop-blur-sm" style={{zIndex:layer}} onMouseDown={e=>{if(e.target===e.currentTarget)onDismiss?.();}}>{children}</div>,document.body);
}

export function Modal({ title, onClose, children, size = 'max-w-xl' }) {
  const panel=useRef(null);
  useEffect(()=>{const previous=document.activeElement;panel.current?.focus();return()=>{if(previous?.isConnected)previous.focus();};},[]);
  useEffect(() => {
    const h=e=>{
      if(e.key==='Escape'){e.stopPropagation();onClose?.();}
      if(e.key==='Tab'){
        const controls=Array.from(panel.current?.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]')||[]).filter(el=>el.getClientRects().length);
        const first=controls[0],last=controls.at(-1);
        if(!first){e.preventDefault();panel.current?.focus();}
        else if(e.shiftKey&&(document.activeElement===first||document.activeElement===panel.current)){e.preventDefault();last.focus();}
        else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===panel.current)){e.preventDefault();first.focus();}
      }
    };
    window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h);
  },[onClose]);
  return <StaffOverlay onDismiss={onClose}><div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className={`pop-in max-h-[92dvh] w-full overflow-y-auto rounded-2xl border border-[#E7DFD4] bg-[#FFFDF8] p-5 text-[#2A1E1B] shadow-2xl outline-none ${size}`}>
    <div className="mb-4 flex items-center justify-between"><h2 className="text-base font-bold">{title}</h2><button type="button" aria-label="Close" onClick={onClose} className={`rounded-full p-1.5 text-[#8A8174] hover:bg-[#F6F0E6] ${focus}`}><X size={16}/></button></div>{children}
  </div></StaffOverlay>;
}

export function ConfirmModal({ message, onCancel, onConfirm, confirmLabel = 'Yes', danger = false }) {
  useModalScrollLock(true);
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#2A1E1B]/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && onCancel?.()}>
      <div role="alertdialog" aria-modal="true" className="w-full max-w-xl rounded-[2rem] border border-[#B9B07A] bg-[#FFFDF2] px-6 pb-6 pt-6 shadow-xl sm:px-10">
        <p className="text-xl font-medium text-[#514633]">{message}</p>
        <div className="mt-16 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="min-w-32 rounded-full border border-[#817565] bg-white px-6 py-2.5 text-sm font-bold text-[#6D6253] hover:bg-[#F8F5F0]">Cancel</button>
          <button type="button" onClick={onConfirm} className={`min-w-32 rounded-full px-6 py-2.5 text-sm font-bold text-white ${danger ? 'bg-[#7A6C5B] hover:bg-[#5C5043]' : 'bg-[#4A3928] hover:bg-[#2A1E1B]'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
