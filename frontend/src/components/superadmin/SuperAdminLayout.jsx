import { useEffect, useRef, useState } from 'react';
import SuperAdminSidebar from './SuperAdminSidebar';
import { useWorkspaceTheme, WorkspaceNavigationContext } from '../workspace/WorkspaceContext';
import { superadminPages } from './superadminNavigation';
import Overview from './Overview';
import SuperadminUserManagementView from '../../pages/superadmin/UserManagementView';
import ServiceManagementView from '../../pages/admin/ServiceManagementView';
import ClientManagementView from '../ClientManagementView';
import SuperadminPOSReportsView from '../../pages/superadmin/POSReportsView';
import SuperadminOperationalLogsView from '../../pages/superadmin/OperationalLogsView';
import SuperadminSystemAuditLogsView from '../../pages/superadmin/SystemAuditLogsView';
import InventoryManagementView from '../../pages/admin/InventoryManagementView';
import ScheduleManagementView from '../../pages/admin/ScheduleManagementView';
import SuperAdminSettings from './SuperAdminSettings';
import { defaultMaintenancePreview } from './superadminPreviewData';
import AccountManagementView from '../../pages/admin/AccountManagementView';
import './superadmin.css';
import { useUnsavedChanges } from '../UnsavedChangesProvider';
import './superadminContent.css';

const demoUser = {
  firstName: 'Aljean Mark', lastName: 'Angeles', email: 'aljeanmark@example.com',
  role: 'SUPERADMIN', isDemo: true,
};

export default function SuperAdminLayout({ currentUser = demoUser, onUserUpdated, onLogout = () => { window.location.href = '/'; } }) {
  const [activePage, setActivePage] = useState('dashboard');
  const { guardNavigation } = useUnsavedChanges();
  const [maintenance, setMaintenance] = useState(defaultMaintenancePreview);
  const workspaceRef = useRef(null);
  const { theme } = useWorkspaceTheme();
  const preview = Boolean(currentUser?.isDemo && !currentUser?.accessToken);
  const name = currentUser.fullName || currentUser.name
    || [currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ') || 'Super Admin';

  function navigate(page) {
    if (page === activePage) return;
    guardNavigation(() => {
      setActivePage(page);
      workspaceRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    });
  }

  useEffect(() => {
    let cancelled = false;
    if (!currentUser?.accessToken) return;
    fetch('/api/superadmin/settings/maintenance', {
      headers: { Authorization: `Bearer ${currentUser.accessToken}` },
    }).then(async response => {
      if (!response.ok) return null;
      return response.json();
    }).then(body => {
      if (!cancelled && body?.data) setMaintenance(body.data);
    }).catch(() => { /* Settings page shows the actionable load error. */ });
    return () => { cancelled = true; };
  }, [currentUser?.accessToken]);

  function saveMaintenancePreview(next) {
    setMaintenance(next);
  }

  const views = {
    users: <SuperadminUserManagementView currentUser={currentUser} />,
    services: <ServiceManagementView currentUser={currentUser} />,
    clients: <ClientManagementView currentUser={currentUser} />,
    reports: <SuperadminPOSReportsView currentUser={currentUser} />,
    logs: <SuperadminOperationalLogsView currentUser={currentUser} />,
    inventory: <InventoryManagementView />,
    schedule: <ScheduleManagementView />,
    settings: <SuperAdminSettings currentUser={currentUser} maintenance={maintenance} onSaveMaintenance={saveMaintenancePreview} />,
    account: <AccountManagementView currentUser={currentUser} onUserUpdated={onUserUpdated} />,
    audit: <SuperadminSystemAuditLogsView currentUser={currentUser} />,
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
          {activePage === 'dashboard' ? <Overview name={name} token={currentUser?.accessToken} preview={preview} maintenance={maintenance} onNavigate={navigate} /> : views[activePage]}
        </main>
      </div>
    </div>
    </WorkspaceNavigationContext.Provider>
  );
}