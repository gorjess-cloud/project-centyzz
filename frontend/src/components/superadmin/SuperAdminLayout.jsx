import { useRef, useState } from 'react';
import SuperAdminSidebar from './SuperAdminSidebar';
import { useWorkspaceTheme, WorkspaceNavigationContext } from '../workspace/WorkspaceContext';
import { superadminPages } from './superadminNavigation';
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

const demoUser = {
  firstName: 'Aljean Mark', lastName: 'Angeles', email: 'aljeanmark@example.com',
  role: 'SUPERADMIN', isDemo: true,
};

export default function SuperAdminLayout({ currentUser = demoUser, onUserUpdated, onLogout = () => { window.location.href = '/'; } }) {
  const [activePage, setActivePage] = useState('dashboard');
  const workspaceRef = useRef(null);
  const { theme } = useWorkspaceTheme();
  const name = currentUser.fullName || currentUser.name
    || [currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ') || 'Super Admin';

  function navigate(page) {
    setActivePage(page);
    workspaceRef.current?.scrollTo({ top: 0, behavior: 'instant' });
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
    <WorkspaceNavigationContext.Provider value={{ items: superadminPages, navigate }}>
    <div className="sa-app workspace-theme" data-theme={theme}>
        <SuperAdminSidebar
          activePage={activePage}
          onNavigate={navigate}
          currentUser={currentUser}
          onLogout={onLogout}
        />
      <div className="sa-main" ref={workspaceRef}>
        <main className="sa-content" key={activePage}>
          {activePage === 'dashboard' ? <Overview name={name} token={currentUser?.accessToken} onNavigate={navigate} /> : views[activePage]}
        </main>
      </div>
    </div>
    </WorkspaceNavigationContext.Provider>
  );
}
