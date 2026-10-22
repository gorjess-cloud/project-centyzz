import { useEffect, useState } from 'react';
import { WorkspaceThemeContext } from './WorkspaceContext';
import './workspace.css';

const storageKey = 'centyzz-workspace-theme';

export default function WorkspaceThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    try { localStorage.setItem(storageKey, theme); } catch { /* Keep the in-memory preference if storage is unavailable. */ }
  }, [theme]);

  function toggleTheme() {
    setTheme(previous => previous === 'light' ? 'dark' : 'light');
  }

  return (
    <WorkspaceThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </WorkspaceThemeContext.Provider>
  );
}
