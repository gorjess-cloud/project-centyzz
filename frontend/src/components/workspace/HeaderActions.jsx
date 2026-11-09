import {AdminWorkspaceContext} from './AdminWorkspaceContext';
import AdminHeaderActions from './AdminHeaderActions';
import { useContext, useEffect, useId, useRef, useState } from 'react';
import { Bell, Moon, Search, Sun, X } from 'lucide-react';
import { useWorkspaceTheme, WorkspaceNavigationContext } from './WorkspaceContext';

function LegacyHeaderActions({ className = '' }) {
  const { theme, toggleTheme } = useWorkspaceTheme();
  const { items, navigate } = useContext(WorkspaceNavigationContext);
  const [panel, setPanel] = useState(null);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const searchRef = useRef(null);
  const searchButtonRef = useRef(null);
  const notificationsButtonRef = useRef(null);
  const panelId = useId();
  const isDark = theme === 'dark';
  const results = items.filter(item => item.label.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    if (!panel) return;
    if (panel === 'search') searchRef.current?.focus();
    function closeOutside(event) {
      if (!containerRef.current?.contains(event.target)) setPanel(null);
    }
    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        setPanel(null);
        (panel === 'search' ? searchButtonRef : notificationsButtonRef).current?.focus();
      }
    }
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [panel]);

  function openPanel(next) {
    setPanel(previous => previous === next ? null : next);
    setQuery('');
  }

  return (
    <div className={`workspace-actions ${className}`} ref={containerRef}>
      <button type="button" className="workspace-action" aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'} aria-pressed={isDark} onClick={toggleTheme}>
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
      <button type="button" className="workspace-action" ref={searchButtonRef} aria-label="Search workspace" title="Search workspace" aria-expanded={panel === 'search'} aria-controls={panel === 'search' ? panelId : undefined} onClick={() => openPanel('search')}>
        <Search size={16} />
      </button>
      <button type="button" className="workspace-action" ref={notificationsButtonRef} aria-label="Notifications" title="Notifications" aria-expanded={panel === 'notifications'} aria-controls={panel === 'notifications' ? panelId : undefined} onClick={() => openPanel('notifications')}>
        <Bell size={16} />
      </button>
      {panel && (
        <section className="workspace-action-panel" id={panelId} aria-label={panel === 'search' ? 'Workspace search' : 'Notifications'}>
          <div className="workspace-panel-heading">
            <strong>{panel === 'search' ? 'Find a page' : 'Notifications'}</strong>
            <button type="button" className="workspace-panel-close" aria-label="Close panel" onClick={() => { setPanel(null); (panel === 'search' ? searchButtonRef : notificationsButtonRef).current?.focus(); }}><X size={15} /></button>
          </div>
          {panel === 'search' ? (
            <>
              <label className="workspace-quick-search"><Search size={16} /><input ref={searchRef} aria-label="Search pages" placeholder="Search pages…" value={query} onChange={event => setQuery(event.target.value)} /></label>
              <div className="workspace-search-results">
                {results.map(item => <button type="button" key={item.id} onClick={() => { setPanel(null); navigate(item.id); }}>{item.label}</button>)}
                {!results.length && <p>No pages found.</p>}
              </div>
            </>
          ) : <p className="workspace-no-notifications">No notifications to show.</p>}
        </section>
      )}
    </div>
  );
}

export default function HeaderActions(props){const admin=useContext(AdminWorkspaceContext);return admin?<AdminHeaderActions {...props}/>:<LegacyHeaderActions {...props}/>;}
