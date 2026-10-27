import { useState } from 'react';
import { LayoutDashboard, Receipt, CalendarClock, ClipboardCheck, Settings, LogOut, ChevronLeft } from 'lucide-react';

const ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pos', label: 'POS', icon: Receipt },
  { id: 'schedule', label: 'Schedule', icon: CalendarClock },
  { id: 'inventory', label: 'Inventory', icon: ClipboardCheck },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function StaffSidebar({ activePage, setActivePage, currentUser, onLogout }) {
  const [open, setOpen] = useState(typeof window === 'undefined' || window.innerWidth >= 1024);
  const name = currentUser?.fullName || [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ') || 'Jessica Palma';
  const initials = name.split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

  const go = (id) => { setActivePage(id); if (window.innerWidth < 1024) setOpen(false); };

  return (
    <div className={`relative z-50 w-20 shrink-0 transition-all duration-300 ${open ? 'lg:w-56' : 'lg:w-20'}`}>
    {open && <div className="fixed inset-0 z-40 bg-black/25 lg:hidden" onClick={() => setOpen(false)} />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-[#E7DFD4] bg-[#FFFDF8] select-none transition-all duration-300 lg:static ${open ? 'w-56 shadow-2xl lg:shadow-none' : 'w-20'}`}>
      <button type="button" onClick={() => setOpen(!open)} aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'} title={open ? 'Collapse sidebar' : 'Expand sidebar'}
        className="absolute -right-3 top-6 z-[60] flex h-6 w-6 items-center justify-center rounded-full border border-[#E7DFD4] bg-white text-[#443523] shadow-md transition-transform hover:scale-110 active:scale-95">
        <ChevronLeft size={14} className={`transition-transform duration-300 ${open ? '' : 'rotate-180'}`} />
      </button>

      <div className="flex justify-center border-b border-[#E7DFD4] pt-6 pb-4">
        <button type="button" onClick={() => go('pos')} className="flex items-center gap-3 rounded-xl px-2 py-1 active:scale-95 transition-transform" title="Go to POS">
          <img src="/logo.png" alt="Centy'zz" className="h-10 w-10 object-contain" />
          {open && (
            <div className="leading-none text-left">
              <span className="block text-[1.15rem] font-bold uppercase text-[#2A1E1B]">Centy'zz</span>
              <span className="block pt-0.5 text-[8px] font-medium uppercase tracking-[0.25em] text-[#C5A059]">Hair & Beauty</span>
            </div>
          )}
        </button>
      </div>

      <div className="flex justify-center border-b border-[#E7DFD4] py-4">
        <button type="button" onClick={() => go('settings')} className="flex w-full flex-col items-center rounded-2xl px-2 py-1 hover:bg-[#F6F0E6]/60 active:scale-95 transition-all" title="Open profile">
          <div className="relative">
            <div className={`flex items-center justify-center overflow-hidden rounded-full border-2 border-[#C5A059] bg-[#4A3928] font-bold text-[#C5A059] shadow-sm ${open ? 'h-12 w-12 text-sm' : 'h-11 w-11 text-sm'}`}>
              {currentUser?.avatarUrl ? <img src={currentUser.avatarUrl} alt="" className="h-full w-full object-cover" /> : initials}
            </div>
          {open && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-[#D8C2A0] bg-[#EBDBC8] px-2.5 py-0.5 text-[9px] font-extrabold text-[#8C6D3B]">STAFF</span>}
          </div>
          {open && (
            <div className="mt-3 w-full px-2 text-center">
              <h2 className="truncate text-xs font-bold text-[#2A1E1B]">{name}</h2>
              <p className="truncate text-[9px] text-[#8A8174]">{currentUser?.email || 'jessestaff@example.com'}</p>
            </div>
          )}
        </button>
      </div>

      <nav aria-label="Staff navigation" className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {ITEMS.map(({ id, label, icon: Icon }) => {
          const active = activePage === id;
          return (
            <button key={id} type="button" onClick={() => go(id)} title={!open ? label : undefined} aria-current={active ? 'page' : undefined}
              className={`flex w-full touch-manipulation items-center rounded-xl p-2.5 transition-all duration-200 active:scale-95 ${open ? 'justify-start gap-3' : 'justify-center'} ${active ? 'bg-[#4A3928] font-semibold text-white shadow-md' : 'text-[#443523] hover:bg-[#C5A059]/15'}`}>
              <Icon size={18} />
              {open && <span className="truncate text-xs font-medium">{label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-[#E7DFD4] p-3">
        <button type="button" onClick={() => onLogout?.()} title={!open ? 'Log Out' : undefined}
          className={`flex w-full items-center rounded-xl p-2.5 text-[#443523] transition-all hover:bg-red-500/10 hover:text-red-600 active:scale-95 ${open ? 'justify-start gap-3' : 'justify-center'}`}>
          <LogOut size={18} />
          {open && <span className="truncate text-xs font-bold">Log Out</span>}
        </button>
      </div>
    </aside>
    </div>
  );
}
