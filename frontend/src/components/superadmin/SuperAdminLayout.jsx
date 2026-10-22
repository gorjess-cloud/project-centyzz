import { useState } from 'react';
import { Menu, ShieldCheck, ShieldUser, X } from 'lucide-react';
import AdminSidebar from '../AdminSidebar';
import Overview, { AuditTable } from './Overview';
import RolePermissions from './RolePermissions';
import UserManagementView from '../../pages/admin/UserManagementView';
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

export default function SuperAdminLayout({ currentUser = demoUser, onLogout = () => { window.location.href = '/'; } }) {
  const [activePage, setActivePage] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const name = currentUser.fullName || currentUser.name
    || [currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ') || 'Super Admin';

  function navigate(page) {
    setActivePage(page);
    setMobileOpen(false);
  }

  const views = {
    users: <UserManagementView showHeaderActions={false} currentUser={currentUser} />,
    services: <ServiceManagementView showHeaderActions={false} />,
    clients: <ClientManagementView showHeaderActions={false} currentUser={currentUser} />,
    reports: <POSReportsView showHeaderActions={false} />,
    logs: <OperationalLogsView showHeaderActions={false} />,
    inventory: <InventoryManagementView showHeaderActions={false} />,
    schedule: <ScheduleManagementView showHeaderActions={false} />,
    settings: <SettingsView showHeaderActions={false} />,
    account: <AccountManagementView showHeaderActions={false} currentUser={currentUser} />,
    roles: <RolePermissions />,
    audit: <AuditTable full />,
  };

  return (
    <div className="sa-app">
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
          {activePage === 'dashboard' ? <Overview name={name} onNavigate={navigate} /> : views[activePage]}
        </main>
      </div>
    </div>
  );
}
