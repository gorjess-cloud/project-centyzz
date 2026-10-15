import { useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BookingModal from './components/BookingModal';

import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import PromosPage from './pages/PromosPage';
import AboutPage from './pages/AboutPage';
import AuthPage from './pages/AuthPage';
import MemberHomePage from './pages/MemberHomePage';
import MemberServicesPage from './pages/MemberServicesPage';

export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [bookingSessionId, setBookingSessionId] = useState(0);
  const [authMode, setAuthMode] = useState('login');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [memberUser, setMemberUser] = useState(null);

  const handleOpenBooking = (service = null) => {
    setSelectedService(service);
    setBookingSessionId((currentId) => currentId + 1);
    setIsBookingOpen(true);
  };

  const isAuthPage = activePage === 'auth';
  const isMemberDashboard = Boolean(memberUser)
    && ['home', 'member-services', 'member-account'].includes(activePage);
  const enterDemoDashboard = (user) => {
    setMemberUser({ ...user, isDemo: true });
    setActivePage('home');
  };
  const handleLogout = () => {
    setMemberUser(null);
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
              onOpenBooking={handleOpenBooking}
              onLogout={handleLogout}
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
            onOpenBooking={handleOpenBooking}
            onLogout={handleLogout}
            initialSection="account"
          />
        )}
        {activePage === 'member-services' && memberUser && (
          <MemberServicesPage
            user={memberUser}
            isDarkMode={isDarkMode}
            setActivePage={setActivePage}
            onOpenBooking={handleOpenBooking}
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
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
          />
        )}
      </main>

      {!isAuthPage && !isMemberDashboard && (
        <Footer setActivePage={setActivePage} setServiceFilter={setServiceFilter} isDarkMode={isDarkMode} />
      )}

      <BookingModal 
        key={bookingSessionId}
        isOpen={isBookingOpen} 
        onClose={() => setIsBookingOpen(false)} 
        selectedService={selectedService}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}