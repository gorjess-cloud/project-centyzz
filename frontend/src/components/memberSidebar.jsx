import { useState } from "react";
import { CalendarDays, ChevronLeft, Home, LogOut, Scissors, UserRound } from "lucide-react";

const LINKS = [
  { page: "home", label: "Home", icon: Home },
  { page: "member-services", label: "Services", icon: Scissors },
  { page: "member-bookings", label: "Bookings", icon: CalendarDays },
  { page: "member-account", label: "Account", icon: UserRound },
];

export default function MemberSidebar({ user, activePage, setActivePage, onLogout, isDarkMode = false }) {
  const [expanded, setExpanded] = useState(false);
  const name = user?.fullName || user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Member";
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "M";
  let photo = "";
  try { photo = localStorage.getItem(`centyzz-member-avatar:${user?.id ?? user?.email ?? "member"}`) || ""; } catch { /* use initials when browser storage is unavailable */ }
  const current = activePage === "member-book" ? "member-bookings" : activePage;

  return <>
    <aside className={`relative hidden shrink-0 flex-col border-r transition-all lg:sticky lg:top-0 lg:flex lg:h-screen ${expanded ? "w-56" : "w-20"} ${isDarkMode ? "border-[#39342B] bg-[#1D1A16] text-[#F5F1EA]" : "border-[#E9E4D8] bg-[#FFFDF8] text-[#443523]"}`}>
      <button type="button" onClick={() => setExpanded((value) => !value)} aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"} className={`absolute -right-3 top-6 z-20 grid h-6 w-6 place-items-center rounded-full border shadow ${isDarkMode ? "border-[#51493B] bg-[#29251E]" : "border-[#E9E4D8] bg-white"}`}><ChevronLeft size={14} className={expanded ? "" : "rotate-180"} /></button>
      <div className="flex h-16 items-center justify-center gap-3 border-b border-inherit px-3"><img src="/logo.png" alt="Centy'zz Salon" className="h-10 w-10 rounded-full object-cover" />{expanded && <div><strong className="block text-xs">Centy'zz</strong><span className="text-[10px] text-[#C5A059]">Hair & Beauty</span></div>}</div>
      <div className="flex flex-col items-center border-b border-inherit px-2 py-4">{photo ? <img src={photo} alt={`${name} profile`} className={`rounded-full border-2 border-[#C5A059] object-cover ${expanded ? "h-12 w-12" : "h-9 w-9"}`} /> : <div className={`grid place-items-center rounded-full border-2 border-[#C5A059] bg-[#4A3928] font-semibold text-white ${expanded ? "h-12 w-12 text-xs" : "h-9 w-9 text-[10px]"}`}>{initials}</div>}{expanded && <><strong className="mt-2 max-w-full truncate text-xs">{name}</strong><span className="max-w-full truncate text-[9px] text-[#8A8174]">{user?.email}</span></>}</div>
      <nav aria-label="Member navigation" className="flex-1 space-y-1 p-3">{LINKS.map(({ page, label, icon: Icon }) => { const active = current === page; return <button key={page} type="button" onClick={() => setActivePage(page)} aria-current={active ? "page" : undefined} title={expanded ? undefined : label} className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs ${active ? "bg-[#4A3928] text-white" : isDarkMode ? "text-[#C9C1B5] hover:bg-[#C5A059]/15" : "hover:bg-[#C5A059]/15"}`}><Icon size={16} />{expanded && label}</button>; })}</nav>
      <button type="button" onClick={onLogout} className="flex min-h-11 items-center gap-3 border-t border-inherit p-4 text-xs text-red-600"><LogOut size={16} />{expanded && "Log Out"}</button>
    </aside>
    <nav aria-label="Member mobile navigation" className="fixed bottom-3 left-1/2 z-50 flex w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 items-center justify-around rounded-full border border-white/10 bg-[#4A3928]/95 px-2 py-1.5 text-white shadow-xl backdrop-blur-md lg:hidden">{LINKS.map(({ page, label, icon: Icon }) => <button key={page} type="button" onClick={() => setActivePage(page)} aria-current={current === page ? "page" : undefined} className={`flex min-h-11 min-w-[3.5rem] flex-col items-center justify-center rounded-full px-1 text-[10px] ${current === page ? "font-bold text-[#F1E7C6]" : "text-white/70"}`}><Icon size={18} /><span>{label}</span></button>)}</nav>
  </>;
}
