import StaffCashierCloseout from '../../pages/staff/StaffCashierCloseout';
import { useState } from 'react';
import StaffSidebar from './StaffSidebar';
import { MotionStyles } from './ui';
import StaffPOSView from '../../pages/staff/StaffPOSView';
import StaffScheduleView from '../../pages/staff/StaffScheduleView';
import StaffCalendarView from '../../pages/staff/StaffCalendarView';
import StaffInventoryView from '../../pages/staff/StaffInventoryView';
import StaffSettingsView from '../../pages/staff/StaffSettingsView';
import { useWorkspaceTheme } from '../workspace/WorkspaceContext';
import { WorkspaceNavigationContext } from '../workspace/WorkspaceContext';
import { useUnsavedChanges } from '../UnsavedChangesProvider';

const staffPages = [
  { id: 'pos', label: 'POS Checkout' },
  { id: 'cashier-closeout', label: 'My Cashier Closeout' },
  { id: 'schedule', label: 'Appointments' },
  { id: 'calendar', label: 'Schedule' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'settings', label: 'Settings' },
];

export default function StaffLayout({ currentUser, onLogout, onUserUpdated }) {
  const [activePage, setActivePage] = useState('pos');
  const { guardNavigation } = useUnsavedChanges();
  const navigate = (page) => {
    if (page === activePage) return;
    guardNavigation(() => setActivePage(page));
  };
  const { theme } = useWorkspaceTheme();
  return (
    <WorkspaceNavigationContext.Provider value={{ items: staffPages, navigate }}>
    <div data-theme={theme} className="workspace-theme staff-workspace flex h-screen w-screen overflow-hidden bg-[#F6F4EF] text-[#443523] transition-colors duration-300">
      <MotionStyles />
      <StaffSidebar activePage={activePage} setActivePage={navigate} currentUser={currentUser} onLogout={onLogout} />
      <main data-modal-scroll-container className="min-w-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {activePage === 'pos' && <StaffPOSView currentUser={currentUser} />}
          {activePage === 'cashier-closeout' && <StaffCashierCloseout currentUser={currentUser} />}
          {activePage === 'schedule' && <StaffScheduleView currentUser={currentUser} />}
          {activePage === 'calendar' && <StaffCalendarView currentUser={currentUser} />}
          {activePage === 'inventory' && <StaffInventoryView />}
          {activePage === 'settings' && <StaffSettingsView currentUser={currentUser} onUserUpdated={onUserUpdated} />}
        </div>
      </main>
    </div>
    </WorkspaceNavigationContext.Provider>
  );
}
