import { useState } from 'react';
import { Menu, ShieldCheck, ShieldUser, X } from 'lucide-react';
import AdminSidebar from '../AdminSidebar';
import HeaderActions from '../workspace/HeaderActions';
import { useWorkspaceTheme, WorkspaceNavigationContext } from '../workspace/WorkspaceContext';
import { workspacePages } from '../workspace/navigation';
import Overview, { AuditTable } from './Overview';
import RolePermissions from './RolePermissions';
import SuperadminUserManagementView from '../../pages/superadmin/UserManagementView';
import ServiceManagementView from '../../pages/admin/ServiceManagementView';
import ClientManagementView from '../ClientManagementView';
import POSReportsView from '../../pages/admin/POSReportsView';
import OperationalLogsView from '../../pages/admin/OperationalLogsView';
import InventoryManagementView from '../../pages/admin/InventoryManagementView';
import ScheduleManagementView from '../../pages/admin/ScheduleManagementView';
import SettingsView from '../../pages/admin/SettingsView';
import AccountManagementView from '../../pages/admin/AccountManagementView';
import './superadmin.css';

const extraItems = [
  { id: 'roles', label: 'Permission Controls', icon: ShieldUser },
  { id: 'audit', label: 'System Audit Logs', icon: ShieldCheck },
];
const demoUser = {
  firstName: 'Aljean Mark', lastName: 'Angeles', email: 'aljeanmark@example.com',
  role: 'SUPERADMIN', isDemo: true,
};

export default function SuperAdminLayout({ currentUser = demoUser, onUserUpdated, onLogout = () => { window.location.href = '/'; } }) {
  const [activePage, setActivePage] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme } = useWorkspaceTheme();
  const name = currentUser.fullName || currentUser.name
    || [currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ') || 'Super Admin';

  function navigate(page) {
    setActivePage(page);
    setMobileOpen(false);
  }

  const views = {
    users: <SuperadminUserManagementView currentUser={currentUser} />,
    services: <ServiceManagementView currentUser={currentUser} />,
    clients: <ClientManagementView currentUser={currentUser} />,
    reports: <POSReportsView currentUser={currentUser} />,
    logs: <OperationalLogsView />,
    inventory: <InventoryManagementView />,
    schedule: <ScheduleManagementView />,
    settings: <SettingsView />,
    account: <AccountManagementView currentUser={currentUser} onUserUpdated={onUserUpdated} />,
    roles: <RolePermissions />,
    audit: <AuditTable full token={currentUser?.accessToken} />,
  };

  return (
    <WorkspaceNavigationContext.Provider value={{ items: [...workspacePages, ...extraItems], navigate }}>
    <div className="sa-app workspace-theme" data-theme={theme}>
      {mobileOpen && (
        <button className="sa-mobile-backdrop" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
      )}
      <div className={`sa-shared-sidebar ${mobileOpen ? 'sa-shared-open' : ''}`}>
        <button className="sa-mobile-close" aria-label="Close navigation" onClick={() => setMobileOpen(false)}>
          <X size={19} />
        </button>
        <AdminSidebar
          activePage={activePage}
          setActivePage={navigate}
          currentUser={currentUser}
          onLogout={onLogout}
          extraItems={extraItems}
          className="sa-staff-sidebar"
        />
      </div>
      <div className="sa-main">
        <button className="sa-mobile-menu sa-page-menu" aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
          <Menu size={21} />
        </button>
        <main className="sa-content" key={activePage}>
          {['roles', 'audit'].includes(activePage) && <div className="workspace-toolbar"><HeaderActions /></div>}
          {activePage === 'dashboard' ? <Overview name={name} token={currentUser?.accessToken} onNavigate={navigate} /> : views[activePage]}
        </main>
      </div>
    </div>
    </WorkspaceNavigationContext.Provider>
  );
}
