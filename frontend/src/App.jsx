import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BookingModal from './components/BookingModal';
import AdminLayout from './components/AdminLayout';
import { api } from './api/client.js'; // 👈 Fixed import path

import ConfirmationModal from './components/ConfirmationModal';
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import PromosPage from './pages/PromosPage';
import AboutPage from './pages/AboutPage';
import AuthPage from './pages/AuthPage';
import MemberHomePage from './pages/MemberHomePage';
import MemberServicesPage from './pages/MemberServicesPage';
import MemberBookingsPage from './pages/MemberBookingsPage';
import MemberBook from './pages/MemberBook';
import { useWorkspaceTheme } from './components/workspace/WorkspaceContext';


export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [bookingSessionId, setBookingSessionId] = useState(0);
  const [authMode, setAuthMode] = useState('login');
  const { theme, toggleTheme } = useWorkspaceTheme();
  const isDarkMode = theme === 'dark';
  const setIsDarkMode = (next) => {
    const resolved = typeof next === 'function' ? next(isDarkMode) : next;
    if (Boolean(resolved) !== isDarkMode) toggleTheme();
  };
  const [memberUser, setMemberUser] = useState(null);
  const [memberAppointments, setMemberAppointments] = useState([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState('');
  const [appointmentsRefreshKey, setAppointmentsRefreshKey] = useState(0);
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    if (!memberUser?.accessToken) return undefined;

    let isCurrent = true;

    api.getMyAppointments(memberUser.accessToken)
      .then((result) => {
        if (isCurrent) setMemberAppointments(result.data ?? []);
      })
      .catch((error) => {
        if (isCurrent) setAppointmentsError(error.message);
      })
      .finally(() => {
        if (isCurrent) setIsLoadingAppointments(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [memberUser?.accessToken, appointmentsRefreshKey]);

  const handleOpenBooking = (service = null) => {
    if (memberUser) {
      setIsBookingOpen(false);
      setSelectedService(service);
      setActivePage('member-book');
      return;
    }

    setSelectedService(service);
    setBookingSessionId((currentId) => currentId + 1);
    setIsBookingOpen(true);
  };

  const handleMemberBooking = (service = null) => {
    setIsBookingOpen(false);
    setSelectedService(service);
    setActivePage('member-book');
  };

  const handleAppointmentCreated = () => {
    setIsLoadingAppointments(true);
    setAppointmentsError('');
    setAppointmentsRefreshKey((key) => key + 1);
  };

  const isAuthPage = activePage === 'auth';
  const isAdminDashboard = activePage === 'admin';
  const isMemberDashboard = Boolean(memberUser)
    && ['home', 'member-services', 'member-bookings', 'member-book', 'member-account'].includes(activePage);

  const enterDemoDashboard = (user) => {
    setMemberAppointments([]);
    setAppointmentsError('');
    setIsLoadingAppointments(false);

    const role = (user?.role || 'CLIENT').toUpperCase();
    const isEmployee = ['ADMIN', 'SUPERADMIN', 'STAFF'].includes(role);

    const userData = { ...user, role: isEmployee ? role : 'CLIENT', isDemo: true };
    setMemberUser(userData);
    setActivePage(isEmployee ? 'admin' : 'home');
  };

  const enterMemberDashboard = (user, accessToken) => {
    setIsBookingOpen(false);
    setMemberAppointments([]);
    setAppointmentsError('');
    setIsLoadingAppointments(true);

    const role = (user?.role || 'CLIENT').toUpperCase();
    const isEmployee = ['ADMIN', 'SUPERADMIN', 'STAFF'].includes(role);

    const userData = {
      ...user,
      accessToken,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || 'User',
      role: isEmployee ? role : 'CLIENT',
      isDemo: false,
    };

    setMemberUser(userData);
    setActivePage(isEmployee ? 'admin' : 'home');
  };

  const handleLogout = () => {
    setMemberUser(null);
    setMemberAppointments([]);
    setAppointmentsError('');
    setIsLoadingAppointments(false);
    setActivePage('home');
  };

  const requestLogout = () => setConfirmLogout(true);

  const confirmAndLogout = () => {
    setConfirmLogout(false);
    handleLogout();
  };

  const handleProfileUpdated = (profile) => {
    setMemberUser((current) => current ? {
      ...current,
      ...profile,
      name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
    } : current);
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between overflow-x-clip ${isDarkMode ? 'bg-[#111111] text-[#F5F1EA]' : 'bg-[#FDFBF7] text-[#3A2E2B]'}`}>
      
      {!isAuthPage && !isMemberDashboard && !isAdminDashboard && (
        <Navbar 
          activePage={activePage} 
          setActivePage={setActivePage} 
          onOpenBooking={handleOpenBooking}
          setServiceFilter={setServiceFilter}
          setAuthMode={setAuthMode}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          currentUser={memberUser}
          onLogout={requestLogout}
        />
      )}

      <main className="flex-1">
        {isAdminDashboard && (
          <AdminLayout 
            currentUser={memberUser || { firstName: 'Millicent', lastName: 'Campillos', email: 'MillicentCampillos@example.com', role: 'ADMIN' }} 
            onLogout={requestLogout}
          />
        )}

        {!isAdminDashboard && activePage === 'home' && (
          memberUser ? (
            <MemberHomePage
              user={memberUser}
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
              setActivePage={setActivePage}
              onOpenBooking={handleMemberBooking}
              onLogout={requestLogout}
              onLogout={handleLogout}
              onUserUpdated={handleProfileUpdated}
              appointments={memberAppointments}
              isLoadingAppointments={isLoadingAppointments}
              appointmentsError={appointmentsError}
            />
          ) : (
            <HomePage
              setActivePage={setActivePage}
              setServiceFilter={setServiceFilter}
              onOpenBooking={handleOpenBooking}
              isDarkMode={isDarkMode}
            />
          )
        )}
        {!isAdminDashboard && activePage === 'member-account' && memberUser && (
          <MemberHomePage
            user={memberUser}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            setActivePage={setActivePage}
            onOpenBooking={handleMemberBooking}
            onLogout={requestLogout}
            onLogout={handleLogout}
            onUserUpdated={handleProfileUpdated}
            initialSection="account"
            appointments={memberAppointments}
            isLoadingAppointments={isLoadingAppointments}
            appointmentsError={appointmentsError}
          />
        )}
        {!isAdminDashboard && activePage === 'member-services' && memberUser && (
          <MemberServicesPage
            user={memberUser}
            isDarkMode={isDarkMode}
            setActivePage={setActivePage}
            onOpenBooking={handleMemberBooking}
            onLogout={requestLogout}
            appointments={memberAppointments}
            isLoadingAppointments={isLoadingAppointments}
            appointmentsError={appointmentsError}
          />
        )}
        {!isAdminDashboard && activePage === 'member-book' && memberUser && (
          <MemberBook
            user={memberUser}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            setActivePage={setActivePage}
            onLogout={requestLogout}
            selectedService={selectedService}
            onAppointmentCreated={handleAppointmentCreated}
          />
        )}
        {!isAdminDashboard && activePage === 'member-bookings' && memberUser && (
          <MemberBookingsPage
            user={memberUser}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            setActivePage={setActivePage}
            onOpenBooking={handleMemberBooking}
            onLogout={requestLogout}
          />
        )}
        {!isAdminDashboard && activePage === 'services' && (
          <ServicesPage 
            serviceFilter={serviceFilter}
            setServiceFilter={setServiceFilter}
            onOpenBooking={handleOpenBooking}
            setActivePage={setActivePage}
            setAuthMode={setAuthMode}
            currentUser={memberUser}
            isDarkMode={isDarkMode}
          />
        )}
        {!isAdminDashboard && activePage === 'promos' && (
          <PromosPage
            onOpenBooking={handleOpenBooking}
            setActivePage={setActivePage}
            setAuthMode={setAuthMode}
            isDarkMode={isDarkMode}
          />
        )}
        {!isAdminDashboard && activePage === 'about' && (
          <AboutPage isDarkMode={isDarkMode} />
        )}
        {!isAdminDashboard && activePage === 'auth' && (
          <AuthPage
            mode={authMode}
            setMode={setAuthMode}
            onBackToSalon={() => setActivePage('home')}
            onPreviewDashboard={enterDemoDashboard}
            onAuthenticated={enterMemberDashboard}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
          />
        )}
      </main>

      {!isAuthPage && !isMemberDashboard && !isAdminDashboard && (
        <Footer setActivePage={setActivePage} setServiceFilter={setServiceFilter} isDarkMode={isDarkMode} />
      )}

      {confirmLogout && <ConfirmationModal title="Log out?" message="Are you sure you want to log out of your account?" confirmLabel="Log out" danger onCancel={() => setConfirmLogout(false)} onConfirm={confirmAndLogout} />}

      {!memberUser && !isAdminDashboard && (
        <BookingModal
          key={bookingSessionId}
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          selectedService={selectedService}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
}
