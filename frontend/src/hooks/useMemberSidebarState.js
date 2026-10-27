import { useState } from "react";

const STORAGE_KEY = "centyzz-member-sidebar-collapsed";

function readCollapsedState() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export default function useMemberSidebarState() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(readCollapsedState);

  const updateCollapsedState = (nextState) => {
    setIsSidebarCollapsed((currentState) => {
      const nextCollapsed = typeof nextState === "function" ? nextState(currentState) : nextState;
      try {
        localStorage.setItem(STORAGE_KEY, String(nextCollapsed));
      } catch {
        // Keep the in-memory preference when browser storage is unavailable.
      }
      return nextCollapsed;
    });
  };

  return [isSidebarCollapsed, updateCollapsedState];
}
