import { useEffect, useState } from 'react';
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
import { api } from '../../api/client';

const staffPages = [
  { id: 'pos', label: 'POS' },
  { id: 'schedule', label: 'Appointments' },
  { id: 'calendar', label: 'Schedule' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'settings', label: 'Settings' },
];

export default function StaffLayout({ currentUser, onLogout, onUserUpdated }) {
  const [activePage, setActivePage] = useState('pos');
  const [appointments, setAppointments] = useState([]);
  const [appointmentsRequest, setAppointmentsRequest] = useState({ key: '', error: '' });
  const [appointmentsRefreshKey, setAppointmentsRefreshKey] = useState(0);
  const { guardNavigation } = useUnsavedChanges();
  const navigate = (page) => {
    if (page === activePage) return;
    guardNavigation(() => setActivePage(page));
  };
  const { theme } = useWorkspaceTheme();
  const appointmentsRequestKey = `${activePage}:${appointmentsRefreshKey}:${currentUser?.accessToken || ''}`;
  const isAppointmentPage = ['schedule', 'calendar'].includes(activePage);
  const appointmentsLoading = isAppointmentPage
    && Boolean(currentUser?.accessToken)
    && appointmentsRequest.key !== appointmentsRequestKey;
  const appointmentsError = !currentUser?.accessToken
    ? 'Sign in with a staff account to load appointments.'
    : appointmentsRequest.key === appointmentsRequestKey
      ? appointmentsRequest.error
      : '';

  useEffect(() => {
    if (!['schedule', 'calendar'].includes(activePage)) return undefined;
    let active = true;
    if (!currentUser?.accessToken) return () => { active = false; };
    const requestKey = `${activePage}:${appointmentsRefreshKey}:${currentUser.accessToken}`;

    api.getStaffAppointments(currentUser.accessToken)
      .then((result) => {
        if (!active) return;
        if (!Array.isArray(result?.data)) {
          throw new Error('The server returned an invalid appointments list.');
        }
        setAppointments(result.data);
        setAppointmentsRequest({ key: requestKey, error: '' });
      })
      .catch((error) => {
        if (active) setAppointmentsRequest({ key: requestKey, error: error.message || 'Unable to load appointments.' });
      });

    return () => { active = false; };
  }, [activePage, currentUser?.accessToken, appointmentsRefreshKey]);

  const refreshAppointments = () => setAppointmentsRefreshKey((key) => key + 1);
  const updateAppointment = (updatedAppointment) => {
    setAppointments((items) => items.map((item) =>
      item.id === updatedAppointment.id ? { ...item, ...updatedAppointment } : item,
    ));
  };

  return (
    <WorkspaceNavigationContext.Provider value={{ items: staffPages, navigate }}>
    <div data-theme={theme} className="workspace-theme staff-workspace flex h-screen w-screen overflow-hidden bg-[#F6F4EF] text-[#443523] transition-colors duration-300">
      <MotionStyles />
      <StaffSidebar activePage={activePage} setActivePage={navigate} currentUser={currentUser} onLogout={onLogout} />
      <main data-modal-scroll-container className="min-w-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {activePage === 'pos' && <StaffPOSView currentUser={currentUser} />}
          {activePage === 'schedule' && <StaffScheduleView
            currentUser={currentUser}
            appointments={appointments}
            appointmentsLoading={appointmentsLoading}
            appointmentsError={appointmentsError}
            onRefreshAppointments={refreshAppointments}
            onAppointmentUpdated={updateAppointment}
          />}
          {activePage === 'calendar' && <StaffCalendarView
            currentUser={currentUser}
            appointments={appointments}
            appointmentsLoading={appointmentsLoading}
            appointmentsError={appointmentsError}
            onRefreshAppointments={refreshAppointments}
          />}
          {activePage === 'inventory' && <StaffInventoryView />}
          {activePage === 'settings' && <StaffSettingsView currentUser={currentUser} onUserUpdated={onUserUpdated} />}
        </div>
      </main>
    </div>
    </WorkspaceNavigationContext.Provider>
  );
}
