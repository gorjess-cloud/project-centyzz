import { useState } from 'react';
import { 
  Home, 
  Users, 
  Scissors, 
  Smile, 
  BarChart2, 
  FileText, 
  ClipboardList, 
  Calendar, 
  Settings, 
  LogOut
} from 'lucide-react';

export default function AdminSidebar({ 
  activePage = 'dashboard', 
  setActivePage, 
  currentUser, 
  onLogout 
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Exact 9 navigation items matching your reference image order:
  // 1. Dashboard, 2. Users, 3. Services, 4. Clients, 5. Reports, 6. Logs, 7. Inventory, 8. Schedule, 9. Settings
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'services', label: 'Services', icon: Scissors },
    { id: 'clients', label: 'Clients', icon: Smile },
    { id: 'reports', label: 'Reports', icon: BarChart2 },
    { id: 'logs', label: 'Logs', icon: FileText },
    { id: 'inventory', label: 'Inventory', icon: ClipboardList },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const fullName = currentUser?.fullName || currentUser?.name || [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(" ") || "Admin";
  const initials = fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  const sidebarSurface = "border-[#E7DFD4] bg-[#FFFDF8]";
  const mutedText = "text-[#8A8174]";

  return (
    <aside 
      className={`relative hidden lg:flex shrink-0 flex-col border-r lg:sticky lg:top-0 lg:h-screen transition-all duration-300 ease-in-out select-none z-50 ${
        isExpanded ? "w-56" : "w-20"
      } ${sidebarSurface}`}
    >
      {/* Toggle Expand/Collapse Button */}
      <button 
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-3 top-6 flex h-6 w-6 items-center justify-center rounded-full border bg-white text-xs shadow-md transition-transform hover:scale-110 active:scale-95 border-[#E7DFD4] text-[#443523] z-20"
        aria-label="Toggle Sidebar"
      >
        <span className={`transition-transform duration-300 ${isExpanded ? "" : "rotate-180"}`}>
          ‹
        </span>
      </button>

      {/* Logo Section */}
      <div className="flex flex-col items-center pt-6 pb-4 border-b border-[#E7DFD4]">
        <div className="flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="Centy'zz Salon Logo" 
            className="h-10 w-10 object-contain" 
          />
          {isExpanded && (
            <div className="leading-none flex flex-col justify-center">
              <span className="text-[1.2rem] font-bold block uppercase text-[#2A1E1B]">
                Centy'zz
              </span>
              <span className="text-[8px] tracking-[0.25em] text-[#C5A059] block uppercase font-medium pt-0.5">
                Hair & Beauty
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Profile Section */}
      <div className="flex flex-col items-center py-4 border-b border-[#E7DFD4]">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-[#4A3928] text-[#C5A059] font-bold text-sm border-2 border-[#C5A059] flex items-center justify-center shadow-sm overflow-hidden">
            {currentUser?.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span>{initials || "A"}</span>
            )}
          </div>
          
          {isExpanded && (
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#EBDBC8] text-[#8C6D3B] text-[9px] font-bold px-2.5 py-0.5 rounded-full border border-[#D8C2A0] whitespace-nowrap shadow-xs">
              {currentUser?.role || 'Admin'}
            </span>
          )}
        </div>
        
        {isExpanded && (
          <div className="text-center mt-3 px-2">
            <h2 className="text-xs font-bold text-[#2A1E1B] truncate">
              {fullName}
            </h2>
            <p className={`text-[9px] truncate ${mutedText}`}>
              {currentUser?.email || 'admin@example.com'}
            </p>
          </div>
        )}
      </div>

      {/* Navigation Menu Links */}
      <nav aria-label="Admin navigation" className="flex-1 overflow-y-auto py-3 px-3 space-y-1 custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center p-2.5 rounded-xl transition-all duration-200 active:scale-95 ${
                isActive 
                  ? 'bg-[#3A342B] text-white shadow-md font-semibold' 
                  : 'text-[#443523] hover:bg-[#C5A059]/15 hover:text-[#4A3928]'
              } ${isExpanded ? 'justify-start gap-3' : 'justify-center'}`}
              title={!isExpanded ? item.label : undefined}
            >
              <Icon size={18} className={isActive ? 'text-white' : 'text-[#443523]'} />
              {isExpanded && <span className="text-xs font-medium truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Log Out Button */}
      <div className="p-3 border-t border-[#E7DFD4]">
        <button 
          type="button"
          onClick={onLogout}
          className={`w-full flex items-center p-2.5 rounded-xl text-red-600/80 hover:bg-red-500/10 transition-all duration-200 active:scale-95 ${
            isExpanded ? 'justify-start gap-3' : 'justify-center'
          }`}
          title={!isExpanded ? 'Log Out' : undefined}
        >
          <LogOut size={18} />
          {isExpanded && <span className="text-xs font-bold truncate">Log Out</span>}
        </button>
      </div>
    </aside>
  );
}