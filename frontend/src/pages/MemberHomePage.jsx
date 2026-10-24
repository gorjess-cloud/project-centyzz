import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  CalendarDays,
  CalendarPlus,
  Clock3,
  Home,
  LogOut,
  Moon,
  Scissors,
  Search,
  Sun,
  UserRound,
  BadgeCheck,
  CalendarCheck2,
  Pencil,
  Save,
  ShieldCheck,
  X,
  Camera,
  Trash2,
  Crop,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { api } from "../api/client";

const formatMonth = (date) =>
  date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

const POPULAR_SERVICES = [
  {
    title: "Precision Cut & Blow-Dry",
    category: "hair",
    label: "Hair Cut",
    kind: "Hair Services",
    color: "bg-[#9B6B39] text-white",
  },
  {
    title: "Balayage & Couture Color",
    category: "hair",
    label: "Rebond",
    kind: "Hair Services",
    color: "bg-[#F1E7C6] text-[#4D3B2A]",
  },
  {
    title: "Luxury Pedicure & Hydration Spa",
    category: "nails",
    label: "Foot Spa",
    kind: "Nail Services",
    color: "bg-[#BDB782] text-[#3F3A2A]",
  },
];

export default function MemberHomePage({
  user,
  isDarkMode,
  setIsDarkMode,
  setActivePage,
  onOpenBooking,
  onLogout,
  onUserUpdated,
  initialSection = "home",
  appointments = [],
  isLoadingAppointments,
  appointmentsError,
}) {
  const [month, setMonth] = useState(() => new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeSection, setActiveSection] = useState(initialSection);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [accountProfile, setAccountProfile] = useState(user || {});
  const [profileDraft, setProfileDraft] = useState({ firstName: user?.firstName || "", lastName: user?.lastName || "" });
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [accountLoading, setAccountLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);
  const [storedPhoto, setStoredPhoto] = useState({ key: "", data: "" });
  const photoInputRef = useRef(null);
  const photoDragRef = useRef(null);
  const [photoModal, setPhotoModal] = useState(false);
  const [cropSource, setCropSource] = useState("");
  const [photoZoom, setPhotoZoom] = useState(1);
  const [photoOffset, setPhotoOffset] = useState({ x: 0, y: 0 });
  const avatarStorageKey = `centyzz-member-avatar:${user?.id ?? user?.email ?? "member"}`;
  const profilePhoto = storedPhoto.key === avatarStorageKey ? storedPhoto.data : "";

  useEffect(() => {
    let data = "";
    try { data = localStorage.getItem(avatarStorageKey) || ""; } catch { /* Keep the avatar empty when storage is unavailable. */ }
    setStoredPhoto({ key: avatarStorageKey, data });
  }, [avatarStorageKey]);

  useEffect(() => {
    if (storedPhoto.key !== avatarStorageKey) return;
    try {
      if (storedPhoto.data) localStorage.setItem(avatarStorageKey, storedPhoto.data);
      else localStorage.removeItem(avatarStorageKey);
    } catch {
      setProfileMessage({ type: "error", text: "The profile photo could not be saved in this browser." });
    }
  }, [avatarStorageKey, storedPhoto]);

  const handleProfilePhoto = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setProfileMessage({ type: "error", text: "Choose an image file for your profile photo." });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setProfileMessage({ type: "error", text: "Choose an image smaller than 8 MB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCropSource(String(reader.result || ""));
      setPhotoZoom(1);
      setPhotoOffset({ x: 0, y: 0 });
      setPhotoModal("crop");
    };
    reader.onerror = () => setProfileMessage({ type: "error", text: "This image could not be opened. Try another file." });
    reader.readAsDataURL(file);
  };

  const saveProfilePhotoCrop = () => {
    const image = new Image();
    image.onload = () => {
      const size = 512;
      const scale = Math.max(size / image.width, size / image.height) * photoZoom;
      const width = image.width * scale;
      const height = image.height * scale;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      canvas.getContext("2d")?.drawImage(image, (size - width) / 2 + photoOffset.x * 2, (size - height) / 2 + photoOffset.y * 2, width, height);
      setStoredPhoto({ key: avatarStorageKey, data: canvas.toDataURL("image/jpeg", 0.86) });
      setCropSource("");
      setPhotoModal("view");
      setProfileMessage({ type: "success", text: "Profile photo updated." });
    };
    image.onerror = () => setProfileMessage({ type: "error", text: "This image could not be opened. Try another file." });
    image.src = cropSource;
  };

  useEffect(() => {
    setAccountProfile((profile) => ({ ...profile, ...user }));
    setProfileDraft({ firstName: user?.firstName || "", lastName: user?.lastName || "" });
  }, [user?.firstName, user?.lastName, user?.email]);

  useEffect(() => {
    if (activeSection !== "account" || !user?.accessToken) return undefined;
    let current = true;
    setAccountLoading(true);
    api.getMyProfile(user.accessToken)
      .then((result) => {
        if (!current || !result.data) return;
        setAccountProfile((profile) => ({ ...profile, ...result.data }));
        setProfileDraft({ firstName: result.data.firstName || "", lastName: result.data.lastName || "" });
      })
      .catch((error) => { if (current) setProfileMessage({ type: "error", text: error.message }); })
      .finally(() => { if (current) setAccountLoading(false); });
    return () => { current = false; };
  }, [activeSection, user?.accessToken]);

  const saveProfile = async () => {
    if (!user?.accessToken) {
      setProfileMessage({ type: "error", text: "Sign in to save profile changes." });
      return;
    }
    setSavingProfile(true);
    setProfileMessage(null);
    try {
      const result = await api.updateMyProfile(user.accessToken, {
        firstName: profileDraft.firstName.trim(),
        lastName: profileDraft.lastName.trim(),
      });
      setAccountProfile((profile) => ({ ...profile, ...result.data }));
      setProfileDraft({ firstName: result.data.firstName, lastName: result.data.lastName });
      onUserUpdated?.(result.data);
      setEditingProfile(false);
      setProfileMessage({ type: "success", text: "Your profile has been updated." });
    } catch (error) {
      setProfileMessage({ type: "error", text: error.message });
    } finally {
      setSavingProfile(false);
    }
  };

  const fullName = user?.fullName || user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Member";
  const name = user?.firstName || fullName.split(" ")[0];
  const initials = fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const todayDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
  }).format(new Date());
  const upcomingAppointments = appointments
    .filter((appointment) =>
      appointment.appointmentDate >= todayDate &&
      ["PENDING", "CONFIRMED"].includes(String(appointment.status).toUpperCase()),
    )
    .sort((first, second) =>
      `${first.appointmentDate} ${first.startTime}`.localeCompare(`${second.appointmentDate} ${second.startTime}`),
    )
    .slice(0, 3);
  const pastAppointments = appointments
    .filter((appointment) =>
      appointment.appointmentDate < todayDate ||
      ["COMPLETED", "CANCELLED"].includes(String(appointment.status).toUpperCase()),
    )
    .sort((first, second) =>
      `${second.appointmentDate} ${second.startTime}`.localeCompare(`${first.appointmentDate} ${first.startTime}`),
    )
    .slice(0, 3);

  const surface = isDarkMode
    ? "bg-[#171512] text-[#F5F1EA]"
    : "bg-[#F6F4EF] text-[#443523]";
  const cardSurface = isDarkMode
    ? "border-[#39342B] bg-[#211F1B]"
    : "border-[#E9E4D8] bg-white";
  const sidebarSurface = isDarkMode
    ? "border-[#39342B] bg-[#1D1A16]"
    : "border-[#E9E4D8] bg-[#FFFDF8]";
  const mutedText = isDarkMode ? "text-[#C9C1B5]" : "text-[#8A8174]";
  const today = new Date();

  const calendarDays = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstWeekday = new Date(year, monthIndex, 1).getDay();
    const days = new Date(year, monthIndex + 1, 0).getDate();
    return [
      ...Array(firstWeekday).fill(null),
      ...Array.from({ length: days }, (_, index) => index + 1),
    ];
  }, [month]);

  const openServices = () => {
    setActivePage("member-services");
  };

  // NEW: Navigate to member bookings page
  const openBookings = () => {
    setActivePage("member-bookings");
  };

  return (
    <div
      className={`min-h-screen pb-24 lg:pb-0 lg:flex ${surface} transition-colors duration-300`}
    >
      {/* Desktop Sidebar (Compact) */}
      <aside
        className={`relative hidden lg:flex shrink-0 flex-col border-r lg:sticky lg:top-0 lg:h-screen transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "w-20" : "w-48"
        } ${sidebarSurface}`}
      >
        {/* Toggle Collapse Button */}
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed((prev) => !prev)}
          className="absolute -right-3 top-6 flex h-6 w-6 items-center justify-center rounded-full border bg-white text-xs shadow-md transition-transform hover:scale-110 active:scale-95 border-[#E9E4D8] text-[#443523] z-20"
          aria-label="Toggle Sidebar"
        >
          <span
            className={`transition-transform duration-300 ${isSidebarCollapsed ? "rotate-180" : ""}`}
          >
            ‹
          </span>
        </button>

        {/* Logo Section */}
        <div className="flex h-16 items-center justify-center px-4 border-b border-inherit">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Centy'zz Salon"
              className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-[#C5A059]/20"
            />
            {!isSidebarCollapsed && (
              <div className="min-w-0 transition-opacity duration-300">
                <span className="text-xs font-bold leading-tight block truncate">
                  Centy'zz
                </span>
                <span className="text-[10px] text-[#8A8174] block truncate">
                  Hair & Beauty
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Member Profile Badge */}
        <div className="flex flex-col items-center justify-center border-b border-inherit py-4 px-2 text-center transition-all duration-300">
          <div
            role="img"
            aria-label={`${fullName} profile`}
            className={`flex items-center justify-center rounded-full border-2 border-[#C5A059] bg-[#4A3928] font-semibold text-white transition-all duration-300 ${
              isSidebarCollapsed ? "h-9 w-9 text-[10px]" : "mb-2 h-12 w-12 text-xs"
            }`}
          >
            {profilePhoto ? <img src={profilePhoto} alt="" className="h-full w-full rounded-full object-cover" /> : (initials || "M")}
          </div>
          {!isSidebarCollapsed && (
            <div className="w-full px-2">
              <span className="inline-block rounded-full bg-[#E8D9C2]/50 px-2 py-0.5 text-[9px] font-medium text-[#6F4C25] mb-1">
                Exclusive Member
              </span>
              <p className="text-xs font-bold truncate">{fullName}</p>
              <p className={`text-[9px] truncate ${mutedText}`}>{user?.email || "Email not provided"}</p>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav
          aria-label="Member navigation"
          className="flex flex-1 flex-col gap-1.5 p-3"
        >
          {[
            {
              id: "home",
              label: "Home",
              icon: Home,
              action: () => {
                setActiveSection("home");
                setActivePage("home");
              },
            },
            {
              id: "services",
              label: "Services",
              icon: Scissors,
              action: openServices,
            },
            {
              id: "booking",
              label: "Booking",
              icon: CalendarDays,
              action: openBookings,
            }, // <-- Updated
            {
              id: "account",
              label: "Account",
              icon: UserRound,
              action: () => setActivePage("member-account"),
            },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                className={`group flex items-center justify-center lg:justify-start gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-200 active:scale-95 ${
                  isActive
                    ? "bg-[#4A3928] text-white shadow-sm"
                    : "hover:bg-[#C5A059]/15 hover:text-[#4A3928]"
                }`}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                {!isSidebarCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-3 border-t border-inherit">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center justify-center lg:justify-start gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-red-600/80 hover:bg-red-500/10 transition-all duration-200 active:scale-95"
            title={isSidebarCollapsed ? "Log Out" : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isSidebarCollapsed && <span className="truncate">Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-w-0 flex-1 px-3 py-4 transition-all duration-300 sm:px-6 sm:py-5 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <header className="mb-6 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-lg font-bold truncate">
                Good{" "}
                {today.getHours() < 12
                  ? "Morning"
                  : today.getHours() < 18
                    ? "Afternoon"
                    : "Evening"}
                , {name}!
              </h1>
              <p className={`mt-0.5 text-[11px] ${mutedText} truncate`}>
                Today is{" "}
                {today.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsDarkMode((current) => !current)}
                aria-label="Toggle dark mode"
                className={`min-h-11 min-w-11 rounded-full border p-2.5 ${cardSurface} hover:border-[#C5A059] transition-all duration-200 active:scale-95 shadow-sm`}
              >
                {isDarkMode ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                aria-label="Search"
                className={`min-h-11 min-w-11 rounded-full border p-2.5 ${cardSurface} hover:border-[#C5A059] transition-all duration-200 active:scale-95 shadow-sm`}
              >
                <Search className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowNotifications((val) => !val)}
                aria-label="Notifications"
                className={`min-h-11 min-w-11 rounded-full border p-2.5 ${cardSurface} hover:border-[#C5A059] transition-all duration-200 active:scale-95 shadow-sm relative`}
              >
                <Bell className="h-4 w-4" />
              </button>
            </div>
          </header>

          {showNotifications && (
            <div
              role="status"
              className={`mb-4 rounded-xl border p-3.5 text-xs transition-all duration-300 ${cardSurface}`}
            >
              You’re all caught up. New booking updates will appear here.
            </div>
          )}

          {activeSection === "account" ? (
            <section className={`overflow-hidden rounded-2xl border shadow-sm ${cardSurface}`}>
              <div className={`flex flex-wrap items-center justify-between gap-4 border-b p-5 sm:p-7 ${isDarkMode ? "border-[#39342B]" : "border-[#E9E4D8]"}`}>
                <div className="flex min-w-0 items-center gap-4">
                    <div className="relative h-14 w-14 shrink-0">
                      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-[#4A3928] text-lg font-bold text-[#F1E7C6] shadow-sm">
                        {profilePhoto ? <img src={profilePhoto} alt={`${fullName} profile`} className="h-full w-full object-cover" /> : (initials || "M")}
                      </div>
                      <button type="button" aria-label="Manage profile photo" title="Manage profile photo" onClick={() => setPhotoModal("view")} className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#C5A059] text-white shadow transition hover:bg-[#9A7946]"><Camera size={13} /></button>
                      <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePhoto} />
                    </div>
                  <div className="min-w-0">
                    <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${isDarkMode ? "text-[#C5A059]" : "text-[#9A7946]"}`}>Member account</p>
                    <h2 className="mt-1 truncate font-serif text-2xl">{fullName}</h2>
                    <p className={`mt-0.5 truncate text-xs ${mutedText}`}>{accountProfile.email || "Email not provided"}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {profilePhoto && <button type="button" onClick={() => { setStoredPhoto({ key: avatarStorageKey, data: "" }); setProfileMessage({ type: "success", text: "Profile photo removed." }); }} className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${isDarkMode ? "border-[#51493B] hover:bg-white/5" : "border-[#E9E4D8] hover:bg-black/5"}`}><Trash2 size={14} /> Remove photo</button>}
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold ${accountProfile.emailVerified ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                    {accountProfile.emailVerified ? <BadgeCheck size={13} /> : <ShieldCheck size={13} />}
                    {accountProfile.emailVerified ? "Verified email" : "Account active"}
                  </span>
                  {!editingProfile ? (
                    <button type="button" disabled={!user?.accessToken} onClick={() => { setProfileDraft({ firstName: accountProfile.firstName || "", lastName: accountProfile.lastName || "" }); setProfileMessage(null); setEditingProfile(true); }} className="inline-flex items-center gap-2 rounded-xl border border-[#C5A059]/50 bg-[#C5A059]/10 px-4 py-2.5 text-xs font-bold text-[#9A7946] transition hover:bg-[#C5A059]/20 disabled:cursor-not-allowed disabled:opacity-50"><Pencil size={14} /> Edit profile</button>
                  ) : (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => { setEditingProfile(false); setProfileDraft({ firstName: accountProfile.firstName || "", lastName: accountProfile.lastName || "" }); setProfileMessage(null); }} className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold ${isDarkMode ? "border-[#51493B]" : "border-[#E9E4D8]"}`}><X size={14} /> Cancel</button>
                      <button type="button" disabled={savingProfile || !profileDraft.firstName.trim() || !profileDraft.lastName.trim()} onClick={saveProfile} className="inline-flex items-center gap-1.5 rounded-xl bg-[#4A3928] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#2A1E1B] disabled:cursor-not-allowed disabled:opacity-50"><Save size={14} /> {savingProfile ? "Saving…" : "Save changes"}</button>
                    </div>
                  )}
                </div>
              </div>

              {profileMessage && <p role={profileMessage.type === "error" ? "alert" : "status"} className={`mx-5 mt-5 rounded-xl px-4 py-3 text-xs font-medium sm:mx-7 ${profileMessage.type === "error" ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`}>{profileMessage.text}</p>}

              <div className="grid gap-5 p-5 sm:p-7 xl:grid-cols-[minmax(0,1.4fr)_minmax(250px,0.8fr)]">
                <div className={`rounded-2xl border p-5 ${isDarkMode ? "border-[#39342B] bg-[#1D1A16]" : "border-[#E9E4D8] bg-[#FFFDF8]"}`}>
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div><h3 className="text-sm font-bold">Personal information</h3><p className={`mt-1 text-[11px] ${mutedText}`}>Keep your name current for bookings and receipts.</p></div>
                    {accountLoading && <span className={`text-[10px] ${mutedText}`}>Refreshing…</span>}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block"><span className={`mb-1.5 block text-[10px] font-bold uppercase tracking-wide ${mutedText}`}>First name</span><input maxLength={100} disabled={!editingProfile} value={editingProfile ? profileDraft.firstName : accountProfile.firstName || ""} onChange={(event) => setProfileDraft((draft) => ({ ...draft, firstName: event.target.value }))} className={`w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 disabled:opacity-80 ${isDarkMode ? "border-[#51493B] bg-[#211F1B]" : "border-[#E9E4D8] bg-white"}`} /></label>
                    <label className="block"><span className={`mb-1.5 block text-[10px] font-bold uppercase tracking-wide ${mutedText}`}>Last name</span><input maxLength={100} disabled={!editingProfile} value={editingProfile ? profileDraft.lastName : accountProfile.lastName || ""} onChange={(event) => setProfileDraft((draft) => ({ ...draft, lastName: event.target.value }))} className={`w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 disabled:opacity-80 ${isDarkMode ? "border-[#51493B] bg-[#211F1B]" : "border-[#E9E4D8] bg-white"}`} /></label>
                    <label className="block sm:col-span-2"><span className={`mb-1.5 block text-[10px] font-bold uppercase tracking-wide ${mutedText}`}>Email address</span><input readOnly value={accountProfile.email || ""} className={`w-full cursor-not-allowed rounded-xl border px-3.5 py-3 text-sm opacity-80 ${isDarkMode ? "border-[#51493B] bg-[#211F1B]" : "border-[#E9E4D8] bg-white"}`} /><span className={`mt-1.5 block text-[10px] ${mutedText}`}>Email changes require a verification flow.</span></label>
                  </div>
                </div>

                <aside className={`rounded-2xl border p-5 ${isDarkMode ? "border-[#39342B] bg-[#1D1A16]" : "border-[#E9E4D8] bg-[#FFFDF8]"}`}>
                  <h3 className="text-sm font-bold">Your account</h3>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between gap-3 text-xs"><span className={mutedText}>Account type</span><span className="font-semibold">Customer</span></div>
                    <div className="flex items-center justify-between gap-3 text-xs"><span className={mutedText}>Appointments</span><span className="font-semibold">{appointments.length}</span></div>
                    {accountProfile.createdAt && <div className="flex items-center justify-between gap-3 text-xs"><span className={mutedText}>Member since</span><span className="font-semibold">{new Date(accountProfile.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</span></div>}
                  </div>
                  <div className={`mt-5 rounded-xl p-4 ${isDarkMode ? "bg-[#29251E]" : "bg-[#F6F0E6]"}`}>
                    <div className="flex items-start gap-3"><CalendarCheck2 size={17} className="mt-0.5 shrink-0 text-[#9A7946]" /><div><p className="text-xs font-bold">Need to check a booking?</p><p className={`mt-1 text-[10px] leading-relaxed ${mutedText}`}>Review upcoming visits and appointment details from your bookings.</p><button type="button" onClick={openBookings} className="mt-3 text-[11px] font-bold text-[#B48B43] hover:underline">View my bookings →</button></div></div>
                  </div>
                </aside>
              </div>
            </section>
          ) : (
            <>
              <section
                className={`mb-6 rounded-2xl border p-5 ${isDarkMode ? "border-[#39342B] bg-[#211F1B]" : "border-[#E2DCCF] bg-[#EFECE4]"}`}
              >
                <div className="grid items-center gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                  <div>
                    <h2 className="text-sm font-bold">Today’s Popular Picks</h2>
                    <p className={`mt-1 text-[11px] ${mutedText}`}>
                      Explore salon favorites and book your next visit.
                    </p>
                    <button
                      type="button"
                      onClick={openServices}
                      className="mt-4 flex items-center gap-1.5 rounded-full border border-[#D5CEBF] bg-white px-4 py-1.5 text-[11px] font-medium text-[#443523] shadow-sm transition-colors hover:border-[#C5A059]"
                    >
                      See all <span aria-hidden="true">→</span>
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {POPULAR_SERVICES.map((service) => (
                      <button
                        key={service.title}
                        type="button"
                        onClick={() => onOpenBooking({ title: service.title, category: service.category })}
                        className={`flex min-h-[112px] flex-col justify-between rounded-xl p-3.5 text-left transition-transform hover:-translate-y-0.5 ${service.color}`}
                      >
                        <span>
                          <span className="block text-xs font-bold">{service.label}</span>
                          <span className="mt-0.5 block text-[10px] opacity-80">{service.kind}</span>
                        </span>
                        <span className="mt-3 border-t border-current/15 pt-2 text-[10px] font-medium">
                          {service.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* Upcoming Appointments */}
              <section
                className={`mb-6 rounded-2xl border p-5 transition-all duration-300 ${isDarkMode ? "bg-[#211F1B] border-[#39342B]" : "bg-[#EFECE4] border-[#E2DCCF]"}`}
              >
                <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)] items-center">
                  <div>
                    <h2 className="text-sm font-bold">Your Upcoming Appointments</h2>
                    <p className={`mt-1 text-[11px] ${mutedText}`}>
                      Booking details for your account.
                    </p>
                    <button
                      type="button"
                      onClick={openBookings}
                      className="mt-4 rounded-full border bg-white px-4 py-1.5 text-[11px] font-medium border-[#D5CEBF] hover:border-[#C5A059] shadow-sm text-[#443523] flex items-center gap-1.5 transition-all duration-200 active:scale-95"
                    >
                      View bookings <span aria-hidden="true">→</span>
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {appointmentsError ? (
                      <p role="alert" className="text-xs text-red-700">{appointmentsError}</p>
                    ) : isLoadingAppointments ? (
                      <p role="status" className={`text-xs ${mutedText}`}>Loading appointments...</p>
                    ) : upcomingAppointments.length === 0 ? (
                      <p className={`text-xs ${mutedText}`}>You don’t have any upcoming appointments.</p>
                    ) : upcomingAppointments.map((appointment) => (
                      <div key={appointment.id} className={`rounded-xl border p-3 ${cardSurface}`}>
                        <p className="text-xs font-bold">{appointment.service?.name || "Service unavailable"}</p>
                        <p className={`mt-1 text-[10px] ${mutedText}`}>
                          {new Date(`${appointment.appointmentDate}T12:00:00+08:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {String(appointment.startTime).slice(0, 5)}
                        </p>
                        <p className={`mt-1 text-[10px] capitalize ${mutedText}`}>
                          {String(appointment.status).toLowerCase()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Grid Layout: Past Services & Calendar */}
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                {/* Past Services Table */}
                <section
                  className={`overflow-hidden rounded-2xl border transition-all duration-300 ${cardSurface}`}
                >
                  <div className="flex items-center justify-between border-b border-inherit px-4 py-3.5">
                    <h2 className="text-sm font-bold">Appointment History</h2>
                    <button
                      type="button"
                      onClick={openBookings}
                      className="text-xs text-[#B4833F] font-medium hover:underline transition-colors"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_70px_110px] gap-2 px-4 py-2.5 text-[10px] font-semibold text-[#9A907F] border-b border-inherit">
                    <span>Service Name</span>
                    <span>Date</span>
                    <span>Stylist</span>
                  </div>
                  {appointmentsError ? (
                    <p role="alert" className="px-4 py-3 text-xs text-red-700">{appointmentsError}</p>
                  ) : isLoadingAppointments ? (
                    <p role="status" className={`px-4 py-3 text-xs ${mutedText}`}>Loading appointment history...</p>
                  ) : pastAppointments.length === 0 ? (
                    <p className={`px-4 py-4 text-xs ${mutedText}`}>No past appointments yet.</p>
                  ) : pastAppointments.map((appointment, index) => (
                      <div
                        key={appointment.id}
                        className={`grid grid-cols-[minmax(0,1fr)_70px_110px] items-center gap-2 px-4 py-3 text-xs transition-colors duration-150 hover:bg-[#C5A059]/5 ${index ? "border-t border-inherit" : ""}`}
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#4A3928] text-white shadow-xs">
                            <CalendarDays className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <span className="block truncate font-semibold text-xs">
                              {appointment.service?.name || "Service unavailable"}
                            </span>
                            <span className={`text-[10px] ${mutedText}`}>
                              {String(appointment.status).toLowerCase()}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs">{new Date(`${appointment.appointmentDate}T12:00:00+08:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        <span className="truncate text-xs">Not assigned</span>
                      </div>
                  ))}
                </section>

                {/* Calendar & Actions Sidebar */}
                <aside className="space-y-4">
                  <section
                    className={`rounded-2xl border p-4 transition-all duration-300 ${cardSurface}`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() =>
                          setMonth(
                            new Date(
                              month.getFullYear(),
                              month.getMonth() - 1,
                              1,
                            ),
                          )
                        }
                        aria-label="Previous month"
                        className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[#C5A059]/15 transition-colors text-xs"
                      >
                        ‹
                      </button>
                      <h2 className="text-xs font-bold">
                        {formatMonth(month)}
                      </h2>
                      <button
                        type="button"
                        onClick={() =>
                          setMonth(
                            new Date(
                              month.getFullYear(),
                              month.getMonth() + 1,
                              1,
                            ),
                          )
                        }
                        aria-label="Next month"
                        className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[#C5A059]/15 transition-colors text-xs"
                      >
                        ›
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-y-2 text-center text-[10px] mb-1">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                        (day, index) => (
                          <span key={`${day}-${index}`} className={mutedText}>
                            {day}
                          </span>
                        ),
                      )}
                    </div>
                    <div className="grid grid-cols-7 gap-y-2 text-center text-xs">
                      {calendarDays.map((day, index) => (
                        <span
                          key={`${month.getMonth()}-${index}`}
                          className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full transition-all duration-200 ${
                            day === today.getDate() &&
                            month.getMonth() === today.getMonth() &&
                            month.getFullYear() === today.getFullYear()
                              ? "bg-[#4A3928] text-white font-bold shadow-xs"
                              : "hover:bg-[#C5A059]/15"
                          }`}
                        >
                          {day || ""}
                        </span>
                      ))}
                    </div>
                  </section>

                  {/* Book an Appointment button — still opens the modal, only the nav item changed */}
                  <button
                    type="button"
                    onClick={() => onOpenBooking()}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[#4A3928] px-4 py-3.5 text-xs font-semibold text-white hover:bg-[#725334] shadow-md transition-all duration-200 active:scale-95"
                  >
                    <CalendarPlus className="h-4 w-4" /> Book an Appointment
                  </button>

                  <p
                    className={`flex items-center justify-center gap-1.5 text-[10px] ${mutedText}`}
                  >
                    <Clock3 className="h-3 w-3" /> Salon hours: 9:00 AM – 6:00
                    PM
                  </p>
                </aside>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Floating Oval Bottom Navigation Bar (Mobile Only) */}
      <div className="fixed bottom-3 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 lg:hidden">
        <nav
          aria-label="Mobile Navigation"
          className="flex items-center justify-around rounded-full border border-white/10 bg-[#4A3928]/95 px-2 py-1.5 text-white shadow-xl backdrop-blur-md transition-all duration-300"
        >
          {[
            {
              id: "home",
              label: "Home",
              icon: Home,
              action: () => {
                setActiveSection("home");
                setActivePage("home");
              },
            },
            {
              id: "services",
              label: "Services",
              icon: Scissors,
              action: openServices,
            },
            {
              id: "booking",
              label: "Booking",
              icon: CalendarDays,
              action: openBookings,
            }, // <-- Updated
            {
              id: "account",
              label: "Account",
              icon: UserRound,
              action: () => setActivePage("member-account"),
            },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                className={`relative flex min-h-11 min-w-[3.5rem] flex-col items-center justify-center rounded-full px-1 text-[10px] transition-all duration-200 active:scale-90 ${
                  isActive
                    ? "text-[#F1E7C6] font-bold"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-transform duration-200 ${isActive ? "scale-110" : ""}`}
                />
                <span className="mt-0.5 text-[9px]">{item.label}</span>
                {isActive && (
                  <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-[#F1E7C6]" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {photoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) { setPhotoModal(false); setCropSource(""); } }}>
          <section role="dialog" aria-modal="true" aria-labelledby="profile-photo-modal-title" className={`max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border p-5 shadow-2xl sm:p-6 ${isDarkMode ? "border-[#51493B] bg-[#211F1B] text-[#F1E7C6]" : "border-[#E9E4D8] bg-[#FFFDF8] text-[#443523]"}`}>
            {photoModal === "view" ? <>
              <div className="mb-5 flex items-start justify-between gap-4"><div><h2 id="profile-photo-modal-title" className="font-serif text-xl">Profile Picture</h2><p className={`mt-1 text-xs ${mutedText}`}>Preview, update, re-crop, or remove your profile picture.</p></div><button type="button" aria-label="Close" onClick={() => setPhotoModal(false)} className={`rounded-full p-2 ${isDarkMode ? "hover:bg-white/10" : "hover:bg-black/5"}`}><X size={17} /></button></div>
              <div className="mx-auto mb-6 flex h-56 w-56 items-center justify-center overflow-hidden rounded-full bg-[#F6F0E6] text-5xl font-bold text-[#C5A059]">{profilePhoto ? <img src={profilePhoto} alt="Profile preview" className="h-full w-full object-cover" /> : initials || "M"}</div>
              <div className="flex flex-wrap items-center justify-between gap-3"><button type="button" disabled={!profilePhoto} onClick={() => { setStoredPhoto({ key: avatarStorageKey, data: "" }); setPhotoModal(false); setProfileMessage({ type: "success", text: "Profile photo removed." }); }} className="text-xs font-bold text-red-600 disabled:opacity-40">Remove</button><div className="flex flex-wrap gap-2"><button type="button" disabled={!profilePhoto} onClick={() => { setCropSource(profilePhoto); setPhotoZoom(1); setPhotoOffset({ x: 0, y: 0 }); setPhotoModal("crop"); }} className={`rounded-lg border px-4 py-2.5 text-xs font-bold disabled:opacity-40 ${isDarkMode ? "border-[#51493B]" : "border-[#E7DFD4]"}`}><Crop size={14} className="mr-1 inline" />Crop</button><button type="button" onClick={() => photoInputRef.current?.click()} className="flex items-center gap-2 rounded-lg bg-[#4A3928] px-4 py-2.5 text-xs font-bold text-white"><Upload size={14} />Upload New Photo</button></div></div>
            </> : <>
              <div className="mb-5 flex items-start justify-between gap-4"><div><h2 id="profile-photo-modal-title" className="font-serif text-xl">Crop Profile Picture</h2><p className={`mt-1 text-xs ${mutedText}`}>Drag to reposition and use the slider to zoom your photo.</p></div><button type="button" aria-label="Close" onClick={() => { setPhotoModal(false); setCropSource(""); }} className={`rounded-full p-2 ${isDarkMode ? "hover:bg-white/10" : "hover:bg-black/5"}`}><X size={17} /></button></div>
              <div className="mx-auto mb-5 h-64 w-64 max-w-full touch-none select-none overflow-hidden rounded-xl bg-[#F6F0E6]" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); photoDragRef.current = { x: event.clientX, y: event.clientY, offset: photoOffset }; }} onPointerMove={(event) => { if (photoDragRef.current) setPhotoOffset({ x: photoDragRef.current.offset.x + event.clientX - photoDragRef.current.x, y: photoDragRef.current.offset.y + event.clientY - photoDragRef.current.y }); }} onPointerUp={() => { photoDragRef.current = null; }} onPointerCancel={() => { photoDragRef.current = null; }}>
                {cropSource && <img src={cropSource} alt="Crop preview" draggable="false" className="pointer-events-none h-full w-full object-cover" style={{ transform: `scale(${photoZoom}) translate(${photoOffset.x / photoZoom}px, ${photoOffset.y / photoZoom}px)` }} />}
              </div>
              <div className="mb-6 flex items-center gap-3"><ZoomOut size={17} className="shrink-0" /><input aria-label="Zoom photo" type="range" min="1" max="3" step="0.01" value={photoZoom} onChange={(event) => setPhotoZoom(Number(event.target.value))} className="w-full accent-[#4A3928]" /><ZoomIn size={17} className="shrink-0" /></div>
              <div className="flex justify-end gap-2"><button type="button" onClick={() => { setPhotoModal(profilePhoto ? "view" : false); setCropSource(""); }} className={`rounded-lg border px-4 py-2.5 text-xs font-bold ${isDarkMode ? "border-[#51493B]" : "border-[#E7DFD4]"}`}>Cancel</button><button type="button" onClick={saveProfilePhotoCrop} className="rounded-lg bg-[#4A3928] px-5 py-2.5 text-xs font-bold text-white">Done</button></div>
            </>}
          </section>
        </div>
      )}
    </div>
  );
}
