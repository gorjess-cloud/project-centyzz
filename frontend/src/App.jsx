import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BookingModal from './components/BookingModal';
import { api } from './api/client.js';

import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import PromosPage from './pages/PromosPage';
import AboutPage from './pages/AboutPage';
import AuthPage from './pages/AuthPage';
import MemberHomePage from './pages/MemberHomePage';
import MemberServicesPage from './pages/MemberServicesPage';
import MemberBookingsPage from './pages/MemberBookingsPage';
import MemberBook from './pages/MemberBook';

export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [bookingSessionId, setBookingSessionId] = useState(0);
  const [authMode, setAuthMode] = useState('login');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [memberUser, setMemberUser] = useState(null);
  const [memberAppointments, setMemberAppointments] = useState([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState('');
  const [appointmentsRefreshKey, setAppointmentsRefreshKey] = useState(0);

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
  const isMemberDashboard = Boolean(memberUser)
    && ['home', 'member-services', 'member-bookings', 'member-book', 'member-account'].includes(activePage);
  const enterDemoDashboard = (user) => {
    setMemberAppointments([]);
    setAppointmentsError('');
    setIsLoadingAppointments(false);
    setMemberUser({ ...user, isDemo: true });
    setActivePage('home');
  };
  const enterMemberDashboard = (user, accessToken) => {
    setIsBookingOpen(false);
    setMemberAppointments([]);
    setAppointmentsError('');
    setIsLoadingAppointments(true);
    setMemberUser({
      ...user,
      accessToken,
      name: `${user.firstName} ${user.lastName}`.trim(),
      isDemo: false,
    });
    setActivePage('home');
  };
  const handleLogout = () => {
    setMemberUser(null);
    setMemberAppointments([]);
    setAppointmentsError('');
    setIsLoadingAppointments(false);
    setActivePage('home');
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between ${isDarkMode ? 'bg-[#111111] text-[#F5F1EA]' : 'bg-[#FDFBF7] text-[#3A2E2B]'}`}>
      {!isAuthPage && !isMemberDashboard && (
        <Navbar 
          activePage={activePage} 
          setActivePage={setActivePage} 
          onOpenBooking={handleOpenBooking}
          setServiceFilter={setServiceFilter}
          setAuthMode={setAuthMode}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          currentUser={memberUser}
          onLogout={handleLogout}
        />
      )}

      <main className="flex-1">
        {activePage === 'home' && (
          memberUser ? (
            <MemberHomePage
              user={memberUser}
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
              setActivePage={setActivePage}
              onOpenBooking={handleMemberBooking}
              onLogout={handleLogout}
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
        {activePage === 'member-account' && memberUser && (
          <MemberHomePage
            user={memberUser}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            setActivePage={setActivePage}
            onOpenBooking={handleMemberBooking}
            onLogout={handleLogout}
            initialSection="account"
            appointments={memberAppointments}
            isLoadingAppointments={isLoadingAppointments}
            appointmentsError={appointmentsError}
          />
        )}
        {activePage === 'member-services' && memberUser && (
          <MemberServicesPage
            user={memberUser}
            isDarkMode={isDarkMode}
            setActivePage={setActivePage}
            onOpenBooking={handleMemberBooking}
            onLogout={handleLogout}
            appointments={memberAppointments}
            isLoadingAppointments={isLoadingAppointments}
            appointmentsError={appointmentsError}
          />
        )}
        {activePage === 'member-book' && memberUser && (
          <MemberBook
            user={memberUser}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            setActivePage={setActivePage}
            onLogout={handleLogout}
            selectedService={selectedService}
            onAppointmentCreated={handleAppointmentCreated}
          />
        )}
        {activePage === 'member-bookings' && memberUser && (
          <MemberBookingsPage
            user={memberUser}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            setActivePage={setActivePage}
            onOpenBooking={handleMemberBooking}
            onLogout={handleLogout}
          />
        )}
        {activePage === 'services' && (
          <ServicesPage 
            serviceFilter={serviceFilter}
            setServiceFilter={setServiceFilter}
            onOpenBooking={handleOpenBooking}
            isDarkMode={isDarkMode}
          />
        )}
        {activePage === 'promos' && (
          <PromosPage
            onOpenBooking={handleOpenBooking}
            setActivePage={setActivePage}
            setAuthMode={setAuthMode}
            isDarkMode={isDarkMode}
          />
        )}
        {activePage === 'about' && (
          <AboutPage isDarkMode={isDarkMode} />
        )}
        {activePage === 'auth' && (
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

      {!isAuthPage && !isMemberDashboard && (
        <Footer setActivePage={setActivePage} setServiceFilter={setServiceFilter} isDarkMode={isDarkMode} />
      )}

      {!memberUser && (
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