import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import ConfirmationModal from './ConfirmationModal';

const UnsavedChangesContext = createContext(null);
export function useUnsavedChanges() {
  const context = useContext(UnsavedChangesContext);
  if (!context) throw new Error('useUnsavedChanges requires UnsavedChangesProvider');
  return context;
}

export default function UnsavedChangesProvider({ children }) {
  const scopes = useRef(new Set());
  const pending = useRef(null);
  const [dirtyCount, setDirtyCount] = useState(0);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const markDirty = useCallback((scope = 'page') => {
    scopes.current.add(scope); setDirtyCount(scopes.current.size);
  }, []);
  const markSaved = useCallback((scope = 'page') => {
    scopes.current.delete(scope); setDirtyCount(scopes.current.size);
  }, []);
  const guardNavigation = useCallback((action) => {
    if (typeof action !== 'function') return false;
    if (!scopes.current.size) { action(); return true; }
    pending.current = action; setConfirmLeave(true); return false;
  }, []);
  useEffect(() => {
    if (!dirtyCount) return undefined;
    const warn = (event) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirtyCount]);
  const value = useMemo(() => ({ markDirty, markSaved, guardNavigation, hasUnsavedChanges: dirtyCount > 0 }),
    [markDirty, markSaved, guardNavigation, dirtyCount]);
  return <UnsavedChangesContext.Provider value={value}>
    {children}
    {confirmLeave && <ConfirmationModal centered title="Leave without saving?"
      message="You have unsaved changes. Stay here to save them, or discard them and continue."
      cancelLabel="Keep editing" confirmLabel="Discard changes" danger
      onCancel={() => { pending.current = null; setConfirmLeave(false); }}
      onConfirm={() => {
        const action = pending.current; pending.current = null;
        scopes.current.clear(); setDirtyCount(0); setConfirmLeave(false); action?.();
      }} />}
  </UnsavedChangesContext.Provider>;
}
