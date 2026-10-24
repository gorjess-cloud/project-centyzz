import { useState } from 'react';
import { useWorkspaceTheme, WorkspaceNavigationContext } from './workspace/WorkspaceContext';
import { workspacePages } from './workspace/navigation';
import SuperAdminLayout from './superadmin/SuperAdminLayout';
import AdminSidebar from './AdminSidebar';
import StaffLayout from './staff/StaffLayout';
import DashboardView from '../pages/admin/DashboardView';
import UserManagementView from '../pages/admin/UserManagementView';
import ServiceManagementView from '../pages/admin/ServiceManagementView';
import ClientManagementView from './ClientManagementView';
import POSReportsView from '../pages/admin/POSReportsView'; // Fixed import path to point to pages/admin/
import InventoryManagementView from '../pages/admin/InventoryManagementView';
import OperationalLogsView from '../pages/admin/OperationalLogsView';
import SettingsView from '../pages/admin/SettingsView'; // Fixed import path to point to pages/admin/
import ScheduleManagementView from '../pages/admin/ScheduleManagementView';
import AccountManagementView from '../pages/admin/AccountManagementView'; // Fixed import path to point to pages/admin/

export default function AdminLayout({ currentUser, onLogout }) {
  const [activePage, setActivePage] = useState('dashboard');
  const { theme } = useWorkspaceTheme();

  if (currentUser?.role?.toUpperCase() === 'SUPERADMIN') {
    return <SuperAdminLayout currentUser={currentUser} onLogout={onLogout} />;
  }

  if (currentUser?.role?.toUpperCase() === 'STAFF') {
    return <StaffLayout currentUser={currentUser} onLogout={onLogout} />;
  }

  return (
    <WorkspaceNavigationContext.Provider value={{ items: workspacePages, navigate: setActivePage }}>
    <div data-theme={theme} className="workspace-theme flex h-screen w-screen bg-[#F6F4EF] text-[#443523] overflow-hidden transition-colors duration-300">
      {/* 1. Perfect 1:1 Matched Sidebar */}
      <AdminSidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        currentUser={currentUser} 
        onLogout={onLogout} 
      />

      {/* 2. Main Admin Workspace Area */}
      <main className="min-w-0 flex-1 h-full overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {activePage === 'dashboard' && (
            <DashboardView currentUser={currentUser} />
          )}

          {/* USER MANAGEMENT ROUTE */}
          {activePage === 'users' && (
            <UserManagementView currentUser={currentUser} />
          )}

          {activePage === 'services' && (
            <ServiceManagementView currentUser={currentUser} />
          )}

          {activePage === 'inventory' && (
            <InventoryManagementView />
          )}

          {activePage === 'clients' && (
            <ClientManagementView currentUser={currentUser} />
          )}

          {/* POS REPORTS ROUTE */}
          {activePage === 'reports' && (
            <POSReportsView currentUser={currentUser} />
          )}

          {activePage === 'logs' && (
            <OperationalLogsView />
          )}

          {activePage === 'schedule' && <ScheduleManagementView />}

          {activePage === 'settings' && (
            <SettingsView />
          )}

          {activePage === 'account' && <AccountManagementView currentUser={currentUser} />}
        </div>
      </main>
    </div>
    </WorkspaceNavigationContext.Provider>
  );
}
