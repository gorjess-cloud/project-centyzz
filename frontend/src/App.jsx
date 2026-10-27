<<<<<<< .merge_file_bPs3KX
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
=======
import CredentialRecoveryPage from './pages/CredentialRecoveryPage';
import { useEffect, useRef, useState } from 'react';
>>>>>>> .merge_file_AwTDXX
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BookingModal, { clientBookingQueueKey } from './components/BookingModal';
import AdminLayout from './components/AdminLayout';
import FirstManagementSetupModal from './components/FirstManagementSetupModal';
import ManagementSetupDashboardPreview from './components/ManagementSetupDashboardPreview';
import { api } from './api/client.js'; // 👈 Fixed import path

import ConfirmationModal from './components/ConfirmationModal';
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import PromosPage from './pages/PromosPage';
import AboutPage from './pages/AboutPage';
import AuthPage from './pages/AuthPage';
import ForgotPinPage from './pages/ForgotPinPage';
import MemberHomePage from './pages/MemberHomePage';
import MemberServicesPage from './pages/MemberServicesPage';
import MemberBookingsPage from './pages/MemberBookingsPage';
import MemberBook from './pages/MemberBook';
import { useWorkspaceTheme } from './components/workspace/WorkspaceContext';
import { useUnsavedChanges } from './components/UnsavedChangesProvider';

const memberRoutePages = {
  '/booking': 'member-book',
  '/member': 'home',
  '/member/services': 'member-services',
  '/member/bookings': 'member-bookings',
  '/member/account': 'member-account',
};

const memberPagePaths = Object.fromEntries(
  Object.entries(memberRoutePages).map(([path, page]) => [page, path]),
);

export default function App() {
<<<<<<< .merge_file_bPs3KX
  const location = useLocation();
  const navigate = useNavigate();
  const routePage = memberRoutePages[location.pathname];
=======
  const [credentialRecoveryHash] = useState(() => window.location.hash.startsWith('#/recover/') ? window.location.hash : null);
>>>>>>> .merge_file_AwTDXX
  const [activePage, setActivePage] = useState(() => {
    if (window.location.pathname === '/forgot-pin') return 'forgot-pin';
    if (window.location.pathname === '/booking') return 'member-book';
    if (window.location.pathname === '/member/services') return 'member-services';
    if (window.location.pathname === '/member/bookings') return 'member-bookings';
    if (window.location.pathname === '/member/account') return 'member-account';
    if (window.location.pathname === '/member') return 'home';
    if (new URLSearchParams(window.location.search).get('page') === 'auth') return 'auth';
    return 'home';
  });
  const [serviceFilter, setServiceFilter] = useState('all');
  const [isBookingOpen, setIsBookingOpen] = useState(() => new URLSearchParams(window.location.search).has('centyzz_booking'));
  const [selectedService, setSelectedService] = useState(null);
  const [clientBookingQueue, setClientBookingQueue] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(clientBookingQueueKey) || 'null');
      return Array.isArray(saved?.services) && saved.services.length ? saved : null;
    } catch {
      return null;
    }
  });
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
  const page = routePage ? (memberUser ? routePage : 'home') : activePage;
  const { guardNavigation } = useUnsavedChanges();
  const navigatePage = (page) => {
    if (page === activePage || page === routePage) return;
    guardNavigation(() => {
      setActivePage(page);
      if (memberPagePaths[page]) navigate(memberPagePaths[page]);
    });
  };

  useEffect(() => {
    if (routePage && !memberUser) navigate('/', { replace: true });
  }, [routePage, memberUser, navigate]);

  useEffect(() => {
    if (!memberUser?.accessToken || memberUser?.mustCompleteSetup) return undefined;

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
  }, [memberUser?.accessToken, memberUser?.mustCompleteSetup, appointmentsRefreshKey]);

  const handleOpenBooking = (service = null) => {
    if (memberUser) {
      guardNavigation(() => {
        setIsBookingOpen(false);
        setSelectedService(service);
        setActivePage('member-book');
        navigate('/booking', { state: { selectedService: service ?? [] } });
      });
      return;
    }

    setSelectedService(service);
    setBookingSessionId((currentId) => currentId + 1);
    setIsBookingOpen(true);
  };

  const handleMemberBooking = (service = null) => {
    guardNavigation(() => {
      setIsBookingOpen(false);
      setSelectedService(service);
      setActivePage('member-book');
      navigate('/booking', { state: { selectedService: service ?? [] } });
    });
  };

  const handleAppointmentCreated = () => {
    setIsLoadingAppointments(true);
    setAppointmentsError('');
    setAppointmentsRefreshKey((key) => key + 1);
  };

  const closeBookingModal = () => {
    setIsBookingOpen(false);
    if (clientBookingQueue) {
      sessionStorage.removeItem(clientBookingQueueKey);
      setClientBookingQueue(null);
      setActivePage('services');
    }
  };

  const isAuthPage = page === 'auth' || page === 'forgot-pin';
  const isAdminDashboard = page === 'admin';
  const isMemberDashboard = Boolean(memberUser)
    && ['home', 'member-services', 'member-bookings', 'member-book', 'member-account'].includes(page);

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

  const completeManagementSetup = (user, accessToken) => {
    setMemberUser((previous) => ({
      ...previous, ...user, accessToken, mustCompleteSetup: false,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    }));
  };

  const logoutPending = useRef(false);
  const handleLogout = () => {
    guardNavigation(async () => {
      if (logoutPending.current) return;
      logoutPending.current = true;
      if (['ADMIN', 'STAFF'].includes(memberUser?.role) && memberUser?.accessToken && !memberUser?.mustCompleteSetup) {
        try {
          await fetch('/api/admin/operational-logs/sign-out', {
            method: 'POST', headers: { Authorization: `Bearer ${memberUser.accessToken}` },
            signal: AbortSignal.timeout(6000),
          });
        } catch { /* Local logout still completes during a network outage. */ }
      }
      setMemberUser(null);
      setMemberAppointments([]);
      setAppointmentsError('');
      setIsLoadingAppointments(false);
      setActivePage('home');
      logoutPending.current = false;
    });
  };

  const requestLogout = () => guardNavigation(() => setConfirmLogout(true));

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

  if (credentialRecoveryHash) return <CredentialRecoveryPage initialHash={credentialRecoveryHash} />;

  return (
    <div className={`min-h-screen flex flex-col justify-between overflow-x-clip font-sans ${isDarkMode ? 'bg-[#111111] text-[#F5F1EA]' : 'bg-[#FDFBF7] text-[#3A2E2B]'}`}>
      
      {!isAuthPage && !isMemberDashboard && !isAdminDashboard && (
        <Navbar 
          activePage={page}
          setActivePage={navigatePage}
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
        {isAdminDashboard && memberUser?.mustCompleteSetup && (
          <ManagementSetupDashboardPreview role={memberUser.role} />
        )}

        {isAdminDashboard && !memberUser?.mustCompleteSetup && (
          <AdminLayout 
            currentUser={memberUser || { firstName: 'Millicent', lastName: 'Campillos', email: 'MillicentCampillos@example.com', role: 'ADMIN' }} 
            onLogout={requestLogout}
            onUserUpdated={handleProfileUpdated}
          />
        )}

        {!isAdminDashboard && page === 'home' && (
          memberUser ? (
            <MemberHomePage
              user={memberUser}
              isDarkMode={isDarkMode}
              setActivePage={navigatePage}
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
              setActivePage={navigatePage}
              setServiceFilter={setServiceFilter}
              onOpenBooking={handleOpenBooking}
              isDarkMode={isDarkMode}
            />
          )
        )}
        {!isAdminDashboard && page === 'member-account' && memberUser && (
          <MemberHomePage
            user={memberUser}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            setActivePage={navigatePage}
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
        {!isAdminDashboard && page === 'member-services' && memberUser && (
          <MemberServicesPage
            user={memberUser}
            isDarkMode={isDarkMode}
            setActivePage={navigatePage}
            onLogout={requestLogout}
            onAppointmentCreated={handleAppointmentCreated}
            appointments={memberAppointments}
            isLoadingAppointments={isLoadingAppointments}
            appointmentsError={appointmentsError}
          />
        )}
        {!isAdminDashboard && page === 'member-book' && memberUser && (
          <MemberBook
            user={memberUser}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            setActivePage={navigatePage}
            onLogout={requestLogout}
            selectedService={location.state?.selectedService ?? []}
            onAppointmentCreated={handleAppointmentCreated}
          />
        )}
        {!isAdminDashboard && page === 'member-bookings' && memberUser && (
          <MemberBookingsPage
            user={memberUser}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            setActivePage={navigatePage}
            onOpenBooking={handleMemberBooking}
            onLogout={requestLogout}
          />
        )}
        {!isAdminDashboard && page === 'services' && (
          <ServicesPage 
            serviceFilter={serviceFilter}
            setServiceFilter={setServiceFilter}
            onOpenBooking={handleOpenBooking}
            setActivePage={navigatePage}
            setAuthMode={setAuthMode}
            currentUser={memberUser}
            isDarkMode={isDarkMode}
          />
        )}
        {!isAdminDashboard && page === 'promos' && (
          <PromosPage
            onOpenBooking={handleOpenBooking}
            setActivePage={navigatePage}
            setAuthMode={setAuthMode}
            isDarkMode={isDarkMode}
          />
        )}
        {!isAdminDashboard && page === 'about' && (
          <AboutPage isDarkMode={isDarkMode} />
        )}
        {!isAdminDashboard && page === 'auth' && (
          <AuthPage
            mode={authMode}
            setMode={setAuthMode}
            onBackToSalon={() => navigatePage('home')}
            onPreviewDashboard={undefined}
            onAuthenticated={enterMemberDashboard}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
          />
        )}
        {!isAdminDashboard && page === 'forgot-pin' && (
          <ForgotPinPage
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
          />
        )}
      </main>

      {!isAuthPage && !isMemberDashboard && !isAdminDashboard && (
        <Footer setActivePage={navigatePage} setServiceFilter={setServiceFilter} isDarkMode={isDarkMode} />
      )}

      {memberUser?.mustCompleteSetup && ['ADMIN', 'SUPERADMIN', 'STAFF'].includes(memberUser.role) && (
        <FirstManagementSetupModal
          user={memberUser}
          onComplete={completeManagementSetup}
          onLogout={handleLogout}
        />
      )}

      {confirmLogout && <ConfirmationModal title="Log out?" message="Are you sure you want to log out of your account?" confirmLabel="Log out" danger onCancel={() => setConfirmLogout(false)} onConfirm={confirmAndLogout} />}

      {!memberUser && !isAdminDashboard && (
        <BookingModal
          key={bookingSessionId}
          isOpen={isBookingOpen}
          onClose={closeBookingModal}
          selectedService={selectedService}
          initialServices={clientBookingQueue?.services || []}
          initialCompletedCount={clientBookingQueue?.completedCount || 0}
          isClientCart={Boolean(clientBookingQueue)}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
}
