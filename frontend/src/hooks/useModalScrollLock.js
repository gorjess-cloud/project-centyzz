import { useEffect } from 'react';

const locks = new Map();
function lock(element) {
  const existing = locks.get(element);
  if (existing) { existing.count += 1; return; }
  locks.set(element, { count: 1, overflow: element.style.overflow, overscroll: element.style.overscrollBehavior });
  element.style.overflow = 'hidden';
  element.style.overscrollBehavior = 'contain';
}
function unlock(element) {
  const state = locks.get(element);
  if (!state || --state.count > 0) return;
  element.style.overflow = state.overflow;
  element.style.overscrollBehavior = state.overscroll;
  locks.delete(element);
}

export default function useModalScrollLock(open = true) {
  useEffect(() => {
    if (!open) return undefined;
    const elements = [...new Set([document.documentElement, document.body,
      ...document.querySelectorAll('[data-modal-scroll-container], main.overflow-y-auto')])];
    elements.forEach(lock);
    return () => elements.forEach(unlock);
  }, [open]);
}
