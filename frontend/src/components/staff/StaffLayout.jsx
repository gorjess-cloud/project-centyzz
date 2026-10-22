import { useState } from 'react';
import StaffSidebar from './StaffSidebar';
import { MotionStyles } from './ui';
import StaffPOSView from '../../pages/staff/StaffPOSView';
import StaffScheduleView from '../../pages/staff/StaffScheduleView';
import StaffInventoryView from '../../pages/staff/StaffInventoryView';
import StaffSettingsView from '../../pages/staff/StaffSettingsView';

export default function StaffLayout({ currentUser, onLogout }) {
  const [activePage, setActivePage] = useState('pos');
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F6F4EF] text-[#443523]">
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
