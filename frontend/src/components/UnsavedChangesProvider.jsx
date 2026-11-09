import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';

const UnsavedChangesContext = createContext({
  markDirty: () => {},
  markSaved: () => {},
  guardNavigation: (action) => action(),
});

// The provider and its context hook intentionally share one module.
// eslint-disable-next-line react-refresh/only-export-components
export function useUnsavedChanges() {
  return useContext(UnsavedChangesContext);
}

export default function UnsavedChangesProvider({ children }) {
  const [dirtyScopes, setDirtyScopes] = useState(() => new Set());
  const dirtyScopesRef = useRef(dirtyScopes);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const pendingAction = useRef(null);

  useLayoutEffect(() => {
    dirtyScopesRef.current = dirtyScopes;
  }, [dirtyScopes]);

  const markDirty = useCallback((scope) => {
    setDirtyScopes((scopes) => new Set(scopes).add(scope));
  }, []);

  const markSaved = useCallback((scope) => {
    setDirtyScopes((scopes) => {
      const next = new Set(scopes);
      next.delete(scope);
      return next;
    });
  }, []);

  const guardNavigation = useCallback((action) => {
    if (dirtyScopesRef.current.size === 0) {
      action();
      return;
    }
    pendingAction.current = action;
    setIsPromptOpen(true);
  }, []);

  useEffect(() => {
    if (dirtyScopes.size === 0) return undefined;
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirtyScopes.size]);

  const continueEditing = () => {
    pendingAction.current = null;
    setIsPromptOpen(false);
  };

  const discardChanges = () => {
    const action = pendingAction.current;
    pendingAction.current = null;
    dirtyScopesRef.current = new Set();
    setDirtyScopes(new Set());
    setIsPromptOpen(false);
    action?.();
  };

  return (
    <UnsavedChangesContext.Provider value={{ markDirty, markSaved, guardNavigation }}>
      {children}
      {isPromptOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
          <section role="alertdialog" aria-modal="true" aria-labelledby="unsaved-changes-title" className="w-full max-w-md rounded-2xl border border-[#E7DFD4] bg-[#FFFDF8] p-6 text-[#2A1E1B] shadow-2xl">
            <h2 id="unsaved-changes-title" className="text-lg font-bold">Unsaved Changes</h2>
            <p className="mt-2 text-sm text-[#756D60]">You have unsaved changes. Do you wish to continue editing or discard them?</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={continueEditing} className="rounded-xl border border-[#D7CDBD] px-4 py-2.5 text-sm font-semibold text-[#6D6253] hover:bg-[#F6F0E6]">
                Continue Editing
              </button>
              <button type="button" onClick={discardChanges} className="rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800">
                Discard Changes
              </button>
            </div>
          </section>
        </div>
      )}
    </UnsavedChangesContext.Provider>
  );
}
