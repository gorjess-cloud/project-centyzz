import { createContext, useContext } from 'react';

export const WorkspaceThemeContext = createContext(null);
export const WorkspaceNavigationContext = createContext({ items: [], navigate: () => {} });

export function useWorkspaceTheme() {
  const context = useContext(WorkspaceThemeContext);
  if (!context) throw new Error('Workspace controls must be inside WorkspaceThemeProvider.');
  return context;
}
