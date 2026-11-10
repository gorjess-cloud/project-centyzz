import { useState } from "react";
import { CalendarDays, ChevronLeft, Home, LogOut, Scissors, UserRound } from "lucide-react";

const LINKS = [
  { page: "home", label: "Home", icon: Home },
  { page: "member-services", label: "Services", icon: Scissors },
  { page: "member-bookings", label: "Bookings", icon: CalendarDays },
  { page: "member-account", label: "Account", icon: UserRound },
];

export default function MemberSidebar({ user, activePage, setActivePage, onLogout }) {
  const [expanded, setExpanded] = useState(true);
  const name = user?.fullName || user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Member";
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "M";
  let photo = "";
  try { photo = localStorage.getItem(`centyzz-member-avatar:${user?.id ?? user?.email ?? "member"}`) || ""; } catch { /* use initials when browser storage is unavailable */ }
  const current = activePage === "member-book" ? "member-bookings" : activePage;

  return <>
    <aside className={`relative z-50 hidden shrink-0 flex-col border-r transition-all duration-300 ease-in-out select-none lg:sticky lg:top-0 lg:flex lg:h-screen ${expanded ? "w-56" : "w-20"} border-[#E7DFD4] bg-[#FFFDF8] text-[#443523]`}>
      <button type="button" onClick={() => setExpanded((value) => !value)} aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"} className="absolute -right-3 top-6 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-[#E7DFD4] bg-white text-xs text-[#443523] shadow-md transition-transform hover:scale-110 active:scale-95"><ChevronLeft size={14} className={expanded ? "" : "rotate-180"} /></button>
      <div className="flex flex-col items-center border-b border-[#E7DFD4] pb-4 pt-6">
        <div className="flex items-center gap-3 rounded-xl px-2 py-1">
          <img src="/logo.png" alt="Centy'zz Salon" className="h-10 w-10 shrink-0 object-contain" />
          {expanded && <div className="flex flex-col justify-center text-left leading-none"><span className="block text-[1.2rem] font-bold uppercase text-[#2A1E1B]">Centy'zz</span><span className="block pt-0.5 text-[8px] font-medium uppercase tracking-[0.25em] text-[#C5A059]">Hair &amp; Beauty</span></div>}
        </div>
      </div>
      <div className="flex flex-col items-center border-b border-[#E7DFD4] px-2 py-4">
        <div className="group relative flex w-full flex-col items-center rounded-2xl px-2 py-1">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-[#C5A059] bg-[#4A3928] text-sm font-bold text-[#C5A059] shadow-sm">
              {photo ? <img src={photo} alt={`${name} profile`} className="h-full w-full object-cover" /> : initials}
            </div>
            {expanded && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-[#D8C2A0] bg-[#EBDBC8] px-2.5 py-0.5 text-[9px] font-extrabold text-[#8C6D3B] shadow-2xs">CLIENT</span>}
          </div>
          {expanded && <div className="mt-3 w-full truncate px-2 text-center"><h2 className="truncate text-xs font-bold text-[#2A1E1B]">{name}</h2><p className="truncate text-[9px] text-[#8A8174]">{user?.email || "Email not provided"}</p></div>}
        </div>
      </div>
      <nav aria-label="Member navigation" className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {LINKS.map(({ page, label, icon: Icon }) => { const active = current === page; return <button key={page} type="button" onClick={() => setActivePage(page)} aria-current={active ? "page" : undefined} title={!expanded ? label : undefined} className={`flex w-full items-center rounded-xl p-2.5 transition-all duration-200 active:scale-95 ${expanded ? "justify-start gap-3" : "justify-center"} ${active ? "bg-[#3A342B] font-semibold text-white shadow-md" : "text-[#443523] hover:bg-[#C5A059]/15 hover:text-[#4A3928]"}`}><Icon size={18} className={active ? "text-white" : "text-[#443523]"} />{expanded && <span className="truncate text-xs font-medium">{label}</span>}</button>; })}
      </nav>
      <div className="border-t border-[#E7DFD4] p-3">
        <button type="button" onClick={onLogout} title={!expanded ? "Log Out" : undefined} className={`flex w-full items-center rounded-xl p-2.5 text-red-600 transition-all duration-200 hover:bg-red-50 hover:text-red-700 active:scale-95 ${expanded ? "justify-start gap-3" : "justify-center"}`}><LogOut size={18} />{expanded && <span className="truncate text-xs font-bold">Log Out</span>}</button>
      </div>
    </aside>
    <nav aria-label="Member mobile navigation" className="fixed bottom-3 left-1/2 z-50 flex w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 items-center justify-around rounded-full border border-white/10 bg-[#4A3928]/95 px-2 py-1.5 text-white shadow-xl backdrop-blur-md lg:hidden">{LINKS.map(({ page, label, icon: Icon }) => <button key={page} type="button" onClick={() => setActivePage(page)} aria-current={current === page ? "page" : undefined} className={`flex min-h-11 min-w-[3.5rem] flex-col items-center justify-center rounded-full px-1 text-[10px] ${current === page ? "font-bold text-[#F1E7C6]" : "text-white/70"}`}><Icon size={18} /><span>{label}</span></button>)}</nav>
  </>;
}
