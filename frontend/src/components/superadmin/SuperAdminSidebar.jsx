import { useEffect, useId, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, LogOut, Menu, ShieldCheck, X } from 'lucide-react';
import { superadminNavigationGroups } from './superadminNavigation';
import './SuperAdminSidebar.css';

export default function SuperAdminSidebar({ activePage = 'dashboard', onNavigate, currentUser, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarId = useId();
  const sidebarRef = useRef(null);
  const menuRef = useRef(null);
  const closeRef = useRef(null);
  const fullName = currentUser?.fullName || currentUser?.name
    || [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ') || 'Super Admin';
  const initials = fullName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 901px)');
    function closeOnDesktop(event) { if (event.matches) setMobileOpen(false); }
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const menuButton = menuRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    function handleKeyDown(event) {
      if (event.key === 'Escape') setMobileOpen(false);
      if (event.key !== 'Tab') return;
      const buttons = [...sidebarRef.current.querySelectorAll('button:not([disabled])')].filter(button => button.getClientRects().length);
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      menuButton?.focus();
    };
  }, [mobileOpen]);

  function navigate(page) {
    onNavigate(page);
    setMobileOpen(false);
  }

  return (
    <>
      <button ref={menuRef} type="button" className="superadmin-menu-trigger" aria-label="Open superadmin navigation" aria-controls={sidebarId} aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><Menu size={19} /><span>Menu</span></button>
      {mobileOpen && <button type="button" className="superadmin-sidebar-backdrop" aria-label="Close superadmin navigation" tabIndex={-1} onClick={() => setMobileOpen(false)} />}
      <aside ref={sidebarRef} id={sidebarId} className={`superadmin-sidebar${collapsed ? ' is-collapsed' : ''}${mobileOpen ? ' is-mobile-open' : ''}`} aria-label="Superadmin sidebar" role={mobileOpen ? 'dialog' : undefined} aria-modal={mobileOpen || undefined}>
        <button ref={closeRef} type="button" className="superadmin-sidebar-close" aria-label="Close superadmin navigation" onClick={() => setMobileOpen(false)}><X size={18} /></button>
        <button type="button" className="superadmin-sidebar-collapse" aria-label={collapsed ? 'Expand superadmin sidebar' : 'Collapse superadmin sidebar'} aria-expanded={!collapsed} onClick={() => setCollapsed(value => !value)}>{collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}</button>

        <button type="button" className="superadmin-sidebar-brand" aria-label="Centy’zz superadmin dashboard" onClick={() => navigate('dashboard')}>
          <img src="/logo.png" alt="" />
          <span className="superadmin-sidebar-brand-copy"><strong>Centy’zz</strong><span>HAIR & BEAUTY</span></span>
        </button>

        <button type="button" className={`superadmin-sidebar-profile${activePage === 'account' ? ' is-active' : ''}`} aria-label={`My account: ${fullName}`} aria-current={activePage === 'account' ? 'page' : undefined} title={collapsed ? fullName : undefined} onClick={() => navigate('account')}>
          <span className="superadmin-sidebar-avatar">{currentUser?.avatarUrl ? <img src={currentUser.avatarUrl} alt="" /> : initials}<span className="superadmin-sidebar-avatar-mark"><ShieldCheck size={12} /></span></span>
          <span className="superadmin-sidebar-profile-copy"><span className="superadmin-sidebar-role">SUPERADMIN</span><strong>{fullName}</strong><small>{currentUser?.email || 'Manage your account'}</small></span>
        </button>

        <nav className="superadmin-sidebar-navigation" aria-label="Superadmin navigation">
          {superadminNavigationGroups.map(group => <div key={group.label} className="superadmin-sidebar-group">
            <p className="superadmin-sidebar-group-label">{group.label}</p>
            {group.items.map(({ id, label, icon: Icon }) => <button type="button" key={id} className={`superadmin-sidebar-link${activePage === id ? ' is-active' : ''}`} aria-label={label} aria-current={activePage === id ? 'page' : undefined} title={collapsed ? label : undefined} onClick={() => navigate(id)}>
              <Icon size={18} strokeWidth={1.7} /><span className="superadmin-sidebar-link-label">{label}</span><span className="superadmin-sidebar-active-dot" aria-hidden="true" />
            </button>)}
          </div>)}
        </nav>

        <div className="superadmin-sidebar-footer">
          <div className="superadmin-sidebar-access"><ShieldCheck size={17} /><span><strong>Full system access</strong><small>Superadmin workspace</small></span></div>
          <button type="button" className="superadmin-sidebar-logout" aria-label="Log out" title={collapsed ? 'Log out' : undefined} onClick={onLogout}><LogOut size={18} /><span>Log out</span></button>
        </div>
      </aside>
    </>
  );
}
