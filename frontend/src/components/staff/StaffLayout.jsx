import { useState } from 'react';
import StaffSidebar from './StaffSidebar';
import { MotionStyles } from './ui';
import StaffPOSView from '../../pages/staff/StaffPOSView';
import StaffScheduleView from '../../pages/staff/StaffScheduleView';
import StaffInventoryView from '../../pages/staff/StaffInventoryView';
import StaffSettingsView from '../../pages/staff/StaffSettingsView';
import { useWorkspaceTheme } from '../workspace/WorkspaceContext';

export default function StaffLayout({ currentUser, onLogout }) {
  const [activePage, setActivePage] = useState('pos');
  const { theme } = useWorkspaceTheme();
  return (
    <div data-theme={theme} className="workspace-theme staff-workspace flex h-screen w-screen overflow-hidden bg-[#F6F4EF] text-[#443523] transition-colors duration-300">
      <MotionStyles />
      <StaffSidebar activePage={activePage} setActivePage={setActivePage} currentUser={currentUser} onLogout={onLogout} />
      <main className="min-w-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {activePage === 'pos' && <StaffPOSView currentUser={currentUser} />}
          {activePage === 'schedule' && <StaffScheduleView currentUser={currentUser} />}
          {activePage === 'inventory' && <StaffInventoryView />}
          {activePage === 'settings' && <StaffSettingsView currentUser={currentUser} />}
        </div>
      </main>
    </div>
  );
}
