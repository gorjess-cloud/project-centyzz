import { useState } from 'react';
import { Menu, X, Moon, Sun } from 'lucide-react';

export default function Navbar({ activePage, setActivePage, setServiceFilter, setAuthMode, isDarkMode, setIsDarkMode, currentUser, onLogout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const shellClasses = isDarkMode ? 'bg-[#111111]/90 border-[#2A2A2A]' : 'bg-[#F8F5F0]/90 border-[#E7DFD4]';
  const navText = isDarkMode ? 'text-[#F5F1EA]' : 'text-[#2A1E1B]';
  const panelClasses = isDarkMode ? 'bg-[#171717] border-[#2A2A2A]' : 'bg-[#F8F5F0] border-[#E7DFD4]';
  const loginButton = isDarkMode
    ? 'border-[#8D7444] bg-[#242220] text-[#F5F1EA] hover:bg-[#39352F] hover:border-[#C5A059] hover:text-[#E8C77E]'
    : 'border border-[#C5A059] bg-transparent text-[#2A1E1B] hover:bg-[#F6F0E6]';
  const signupButton = isDarkMode
    ? 'border border-[#8D7444] bg-[#3A342B] text-[#F5F1EA] hover:bg-[#51432D] hover:border-[#C5A059]'
    : 'bg-[#D1B06D] text-[#1F1A17] hover:bg-[#C5A059]';

  return (
    <header className={`sticky top-0 z-40 rounded-b-2xl backdrop-blur-md border-b ${shellClasses}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between sm:h-20">
          <div 
            onClick={() => setActivePage('home')}
            className="cursor-pointer flex items-center gap-3 group"
          >
            <img 
              src="/logo.png" 
              alt="Centy'zz Salon Logo" 
              className="h-10 w-10 object-contain transition-transform duration-500 hover:scale-105 sm:h-12 sm:w-12" 
            />
            <div className="leading-none">
              <span className={`text-2xl sm:text-[2.2rem] tracking-[-0.08em] font-bold block uppercase ${isDarkMode ? 'text-[#F5F1EA]' : 'text-[#2A1E1B]'}`}>
                CENTYZZ
              </span>
              <span className="text-[10px] tracking-[0.35em] text-[#C5A059] block uppercase font-medium pt-1">
                HAIR & BEAUTY SALON
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => setActivePage('home')}
              className={`text-sm font-medium transition-colors ${activePage === 'home' ? 'text-[#C5A059] font-semibold border-b-2 border-[#C5A059] pb-1' : `${navText} hover:text-[#C5A059]`}`}
            >
              Home
            </button>
            <button
              onClick={() => { setActivePage('services'); setServiceFilter('all'); }}
              className={`text-sm font-medium transition-colors ${activePage === 'services' ? 'text-[#C5A059] font-semibold border-b-2 border-[#C5A059] pb-1' : `${navText} hover:text-[#C5A059]`}`}
            >
              Services
            </button>
            <button 
              onClick={() => setActivePage('promos')}
              className={`text-sm font-medium transition-colors ${activePage === 'promos' ? 'text-[#C5A059] font-semibold border-b-2 border-[#C5A059] pb-1' : `${navText} hover:text-[#C5A059]`}`}
            >
              Promos
            </button>
            <button 
              onClick={() => setActivePage('about')}
              className={`text-sm font-medium transition-colors ${activePage === 'about' ? 'text-[#C5A059] font-semibold border-b-2 border-[#C5A059] pb-1' : `${navText} hover:text-[#C5A059]`}`}
            >
              About Us
            </button>
          </nav>

          <div className="hidden md:flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setIsDarkMode((prev) => !prev)}
              className={`flex items-center justify-center rounded-full border p-2.5 transition-colors ${isDarkMode ? 'border-[#3A3A3A] bg-[#1D1D1D] text-[#F5F1EA]' : 'border-[#D1B06D] bg-[#F3EFE9] text-[#2A1E1B]'}`}
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {currentUser ? (
              <>
                <span className={`text-sm ${navText}`}>Hi, {currentUser.firstName || currentUser.name}</span>
                <button type="button" onClick={onLogout} className={`px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${loginButton}`}>Log out</button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => { setAuthMode('login'); setActivePage('auth'); }}
                  className={`px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${loginButton}`}
                >
                  Login
                </button>
                <button 
                  onClick={() => { setAuthMode('signup'); setActivePage('auth'); }}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-sm hover:shadow-md ${signupButton}`}
                >
                  Sign up
                </button>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button type="button" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={isMobileMenuOpen} className={`grid min-h-11 min-w-11 place-items-center rounded-lg ${navText} hover:text-[#C5A059]`}>
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className={`md:hidden border-b px-4 pt-2 pb-4 space-y-1 ${panelClasses}`}>
          <button onClick={() => { setActivePage('home'); setIsMobileMenuOpen(false); }} className={`block min-h-11 w-full rounded-lg px-2 text-left font-medium ${navText}`}>Home</button>
          <button onClick={() => { setActivePage('services'); setServiceFilter('all'); setIsMobileMenuOpen(false); }} className={`block min-h-11 w-full rounded-lg px-2 text-left font-medium ${navText}`}>Services</button>
          <button onClick={() => { setActivePage('promos'); setIsMobileMenuOpen(false); }} className={`block min-h-11 w-full rounded-lg px-2 text-left font-medium ${navText}`}>Promos</button>
          <button onClick={() => { setActivePage('about'); setIsMobileMenuOpen(false); }} className={`block min-h-11 w-full rounded-lg px-2 text-left font-medium ${navText}`}>About Us</button>
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsDarkMode((prev) => !prev)}
              className={`flex items-center justify-center rounded-xl border p-3 ${isDarkMode ? 'border-[#3A3A3A] bg-[#1D1D1D] text-[#F5F1EA]' : 'border-[#C5A059] bg-[#F6F0E6] text-[#2A1E1B]'}`}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {currentUser ? (
              <>
                <span className={`flex-1 text-center text-sm ${navText}`}>Hi, {currentUser.firstName || currentUser.name}</span>
                <button onClick={() => { onLogout(); setIsMobileMenuOpen(false); }} className={`flex-1 py-3 rounded-xl border font-medium transition-colors ${loginButton}`}>Log out</button>
              </>
            ) : (
              <>
                <button onClick={() => { setAuthMode('login'); setActivePage('auth'); setIsMobileMenuOpen(false); }} className={`flex-1 py-3 rounded-xl border font-medium transition-colors ${loginButton}`}>Login</button>
                <button onClick={() => { setAuthMode('signup'); setActivePage('auth'); setIsMobileMenuOpen(false); }} className={`flex-1 py-3 rounded-xl font-medium transition-colors ${signupButton}`}>Sign up</button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
