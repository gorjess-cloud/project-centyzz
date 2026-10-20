import { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import DashboardView from '../pages/admin/DashboardView';
import UserManagementView from '../pages/admin/UserManagementView';
import ServiceManagementView from '../pages/admin/ServiceManagementView';
import ClientManagementView from './ClientManagementView';

export default function AdminLayout({ currentUser, onLogout }) {
  const [activePage, setActivePage] = useState('dashboard');

  return (
    <div className="flex h-screen w-screen bg-[#F6F4EF] text-[#443523] overflow-hidden transition-colors duration-300">
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
            <DashboardView currentUser={currentUser} onLogout={onLogout} />
          )}

          {/* 👈 USER MANAGEMENT ROUTE */}
          {activePage === 'users' && (
            <UserManagementView currentUser={currentUser} />
          )}

         {activePage === 'services' && (
            <ServiceManagementView currentUser={currentUser} />
          )}

          {activePage === 'inventory' && (
            <div>
              <h1 className="text-2xl font-serif font-bold text-[#2A1E1B] mb-1">Inventory Management</h1>
              <p className="text-xs text-gray-500">Track salon stock levels and reorder alerts</p>
            </div>
          )}


         {activePage === 'clients' && (
            <ClientManagementView currentUser={currentUser} />
          )}

          {activePage === 'reports' && (
            <div>
              <h1 className="text-2xl font-serif font-bold text-[#2A1E1B] mb-1">Reports & Analytics</h1>
              <p className="text-xs text-gray-500">Analyze daily revenue and service performance</p>
            </div>
          )}

          {activePage === 'logs' && (
            <div>
              <h1 className="text-2xl font-serif font-bold text-[#2A1E1B] mb-1">Audit Logs</h1>
              <p className="text-xs text-gray-500">Track system activities and modifications</p>
            </div>
          )}

          {activePage === 'schedule' && (
            <div>
              <h1 className="text-2xl font-serif font-bold text-[#2A1E1B] mb-1">Master Schedule</h1>
              <p className="text-xs text-gray-500">Calendar schedule and shift assignments</p>
            </div>
          )}

          {activePage === 'settings' && (
            <div>
              <h1 className="text-2xl font-serif font-bold text-[#2A1E1B] mb-1">System Settings</h1>
              <p className="text-xs text-gray-500">Salon operating parameters and database backups</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}