import { useMemo } from 'react';
import { 
  CalendarDays, 
  Home, 
  LogOut, 
  Scissors, 
  UserRound 
} from 'lucide-react';
import useMemberSidebarState from '../hooks/useMemberSidebarState';

export default function MemberSidebar({
  user,
  currentUser,
  activePage = 'home',
  setActivePage,
  onLogout,
  isDarkMode = false,
  className = '',
}) {
  const [isCollapsed, setIsCollapsed] = useMemberSidebarState();
  const userData = user || currentUser;

  const fullName = userData?.fullName || userData?.name || [userData?.firstName, userData?.lastName].filter(Boolean).join(' ') || 'Member';
  const initials = fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'M';

  const profilePhoto = useMemo(() => {
    if (userData?.avatarUrl) return userData.avatarUrl;
    try {
      return localStorage.getItem(`centyzz-member-avatar:${userData?.id ?? userData?.email ?? 'member'}`) || '';
    } catch {
      return '';
    }
  }, [userData]);

  const isExpanded = !isCollapsed;

  const menuItems = [
    { id: 'home', page: 'home', label: 'Home', icon: Home },
    { id: 'services', page: 'member-services', label: 'Services', icon: Scissors },
    { id: 'bookings', page: 'member-bookings', label: 'Bookings', icon: CalendarDays },
    { id: 'account', page: 'member-account', label: 'Account', icon: UserRound },
  ];

  const sidebarSurface = isDarkMode ? 'border-[#39342B] bg-[#1D1A16] text-[#F5F1EA]' : 'border-[#E7DFD4] bg-[#FFFDF8] text-[#443523]';
  const borderDivider = isDarkMode ? 'border-[#39342B]' : 'border-[#E7DFD4]';
  const mutedText = isDarkMode ? 'text-[#C9C1B5]' : 'text-[#8A8174]';

  const isItemActive = (id, page) => {
    if (id === 'home') return activePage === 'home';
    if (id === 'services') return activePage === 'member-services';
    if (id === 'bookings') return activePage === 'member-bookings' || activePage === 'member-book';
    if (id === 'account') return activePage === 'member-account';
    return activePage === page;
  };

  return (
    <>
      {/* Desktop Sidebar (1:1 match with AdminSidebar) */}
      <aside
        className={`${className} relative hidden lg:flex shrink-0 flex-col border-r lg:sticky lg:top-0 lg:h-screen transition-all duration-300 ease-in-out select-none z-50 ${
          isExpanded ? 'w-56' : 'w-20'
        } ${sidebarSurface}`}
      >
        {/* Toggle Expand/Collapse Button */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`absolute -right-3 top-6 flex h-6 w-6 items-center justify-center rounded-full border text-xs shadow-md transition-transform hover:scale-110 active:scale-95 z-20 ${
            isDarkMode ? 'border-[#51493B] bg-[#29251E] text-[#F1E7C6]' : 'border-[#E7DFD4] bg-white text-[#443523]'
          }`}
          aria-label="Toggle Sidebar"
          title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <span className={`transition-transform duration-300 ${isExpanded ? '' : 'rotate-180'}`}>
            ‹
          </span>
        </button>

        {/* Brand Logo Section (Clickable -> Redirects to Home) */}
        <div className={`flex flex-col items-center pt-6 pb-4 border-b ${borderDivider}`}>
          <button
            type="button"
            onClick={() => setActivePage?.('home')}
            className={`flex items-center gap-3 group cursor-pointer focus:outline-none transition-transform active:scale-95 px-2 py-1 rounded-xl ${
              isDarkMode ? 'hover:bg-white/5' : 'hover:bg-[#F6F0E6]/50'
            }`}
            title="Go to Home"
          >
            <img
              src="/logo.png"
              alt="Centy'zz Salon Logo"
              className="h-10 w-10 object-contain transition-transform group-hover:scale-105"
            />
            {isExpanded && (
              <div className="leading-none flex flex-col justify-center text-left">
                <span className={`text-[1.2rem] font-bold block uppercase group-hover:text-[#8B5E3C] transition-colors ${isDarkMode ? 'text-[#F5F1EA]' : 'text-[#2A1E1B]'}`}>
                  Centy'zz
                </span>
                <span className="text-[8px] tracking-[0.25em] text-[#C5A059] block uppercase font-medium pt-0.5">
                  Hair & Beauty
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Profile Section (Clickable -> Redirects to Account) */}
        <div className={`flex flex-col items-center py-4 border-b ${borderDivider}`}>
          <button
            type="button"
            onClick={() => setActivePage?.('member-account')}
            className={`flex flex-col items-center w-full focus:outline-none group cursor-pointer transition-all active:scale-95 px-2 py-1 rounded-2xl ${
              activePage === 'member-account'
                ? (isDarkMode ? 'bg-[#2E2820] shadow-xs' : 'bg-[#F6F0E6] shadow-xs')
                : (isDarkMode ? 'hover:bg-[#2A241C]' : 'hover:bg-[#F6F0E6]/60')
            }`}
            title="Open Account Settings"
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-[#4A3928] text-[#C5A059] font-bold text-sm border-2 border-[#C5A059] flex items-center justify-center shadow-sm overflow-hidden group-hover:border-[#8B5E3C] group-hover:shadow-md transition-all">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{initials || 'M'}</span>
                )}
              </div>

              {isExpanded && (
                <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border whitespace-nowrap shadow-2xs group-hover:bg-[#E8C27B] group-hover:text-[#5A3810] transition-colors ${
                  isDarkMode
                    ? 'bg-[#3A3023] text-[#D9B66C] border-[#51493B]'
                    : 'bg-[#EBDBC8] text-[#8C6D3B] border-[#D8C2A0]'
                }`}>
                  MEMBER
                </span>
              )}
            </div>

            {isExpanded && (
              <div className="text-center mt-3 px-2 w-full">
                <h2 className={`text-xs font-bold truncate group-hover:text-[#8B5E3C] transition-colors ${isDarkMode ? 'text-[#F5F1EA]' : 'text-[#2A1E1B]'}`}>
                  {fullName}
                </h2>
                <p className={`text-[9px] truncate ${mutedText} ${isDarkMode ? 'group-hover:text-[#D6D0C8]' : 'group-hover:text-[#443523]'}`}>
                  {userData?.email || 'Email not provided'}
                </p>
              </div>
            )}
          </button>
        </div>

        {/* Navigation Menu Links */}
        <nav aria-label="Member navigation" className="flex-1 overflow-y-auto py-3 px-3 space-y-1 custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item.id, item.page);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActivePage?.(item.page)}
                className={`w-full flex items-center p-2.5 rounded-xl transition-all duration-200 active:scale-95 ${
                  isActive
                    ? (isDarkMode ? 'bg-[#4A3928] text-white shadow-md font-semibold' : 'bg-[#3A342B] text-white shadow-md font-semibold')
                    : (isDarkMode ? 'text-[#C9C1B5] hover:bg-[#C5A059]/15 hover:text-[#F1E7C6]' : 'text-[#443523] hover:bg-[#C5A059]/15 hover:text-[#4A3928]')
                } ${isExpanded ? 'justify-start gap-3' : 'justify-center'}`}
                title={!isExpanded ? item.label : undefined}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={18} className={isActive ? 'text-white' : (isDarkMode ? 'text-[#C9C1B5]' : 'text-[#443523]')} />
                {isExpanded && <span className="text-xs font-medium truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Log Out Button */}
        <div className={`p-3 border-t ${borderDivider}`}>
          <button
            type="button"
            onClick={onLogout}
            className={`w-full flex items-center p-2.5 rounded-xl text-red-600/80 hover:bg-red-500/10 transition-all duration-200 active:scale-95 ${
              isExpanded ? 'justify-start gap-3' : 'justify-center'
            }`}
            title={!isExpanded ? 'Log Out' : undefined}
            aria-label="Log Out"
          >
            <LogOut size={18} className="transition-transform group-hover:scale-110" />
            {isExpanded && <span className="text-xs font-bold truncate">Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Floating Oval Bottom Nav Bar (Mobile Only) */}
      <nav
        aria-label="Member mobile navigation"
        className="fixed bottom-3 left-1/2 z-50 flex w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 items-center justify-around rounded-full border border-white/10 bg-[#4A3928]/95 px-2 py-1.5 text-white shadow-xl backdrop-blur-md lg:hidden"
      >
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = isItemActive(item.id, item.page);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActivePage?.(item.page)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-h-11 min-w-[3.5rem] flex-col items-center justify-center rounded-full px-1 text-[10px] transition-all duration-200 ${
                isActive ? 'font-bold text-[#F1E7C6]' : 'text-white/70'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="mt-0.5 text-[9px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

