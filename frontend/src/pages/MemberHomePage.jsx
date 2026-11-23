import { useEffect, useMemo, useState } from "react";
import useMemberSidebarState from "../hooks/useMemberSidebarState";
import { useUnsavedChanges } from "../components/UnsavedChangesProvider";
import {
  Bell,
  CalendarDays,
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
} from "lucide-react";
import { api } from "../api/client";
import ConfirmationModal from "../components/ConfirmationModal";
import ProfilePictureModal from "../components/ProfilePictureModal";
import SaveChangesModal from "../components/SaveChangesModal";

const formatMonth = (date) =>
  date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

const dateKey = (value) => String(value ?? "").slice(0, 10);

const formatAppointmentDate = (value, options = { month: "short", day: "numeric" }) => {
  const key = dateKey(value);
  if (!key) return "Date pending";
  return new Date(`${key}T12:00:00+08:00`).toLocaleDateString("en-US", options);
};

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
    color: "bg-[#F8F3D8] text-[#4D3B2A]",
  },
  {
    title: "Luxury Pedicure & Hydration Spa",
    category: "nails",
    label: "Foot Spa",
    kind: "Nail Services",
    color: "bg-[#B9B589] text-white",
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
  const { markDirty, markSaved, guardNavigation } = useUnsavedChanges();
  const profileScope = `member-profile-${user?.id || user?.email || "current"}`;
  const [month, setMonth] = useState(() => new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeSection, setActiveSection] = useState(initialSection);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useMemberSidebarState();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const [accountProfile, setAccountProfile] = useState(user || {});
  const [profileDraft, setProfileDraft] = useState({ firstName: user?.firstName || "", lastName: user?.lastName || "" });
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [accountLoading, setAccountLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);
  const [storedPhoto, setStoredPhoto] = useState({ key: "", data: "" });
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [confirmPhotoRemoval, setConfirmPhotoRemoval] = useState(false);
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

  const removeProfilePhoto = () => {
    setStoredPhoto({ key: avatarStorageKey, data: "" });
    setProfileMessage({ type: "success", text: "Profile photo removed." });
    setConfirmPhotoRemoval(false);
  };
  const saveProfilePhoto = (imageUrl) => {
    setStoredPhoto({ key: avatarStorageKey, data: imageUrl });
    setProfileMessage({ type: "success", text: "Profile photo updated." });
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
      markSaved(profileScope);
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
      dateKey(appointment.appointmentDate) >= todayDate &&
      ["PENDING", "CONFIRMED"].includes(String(appointment.status).toUpperCase()),
    )
    .sort((first, second) =>
      `${dateKey(first.appointmentDate)} ${first.startTime}`.localeCompare(`${dateKey(second.appointmentDate)} ${second.startTime}`),
    )
    .slice(0, 3);
  const pastAppointments = appointments
    .filter((appointment) =>
      dateKey(appointment.appointmentDate) < todayDate ||
      ["COMPLETED", "CANCELLED"].includes(String(appointment.status).toUpperCase()),
    )
    .sort((first, second) =>
      `${dateKey(second.appointmentDate)} ${second.startTime}`.localeCompare(`${dateKey(first.appointmentDate)} ${first.startTime}`),
    )
    .slice(0, 3);

  const surface = isDarkMode
    ? "bg-[#171512] text-[#F5F1EA]"
    : "bg-[#F6F4EF] text-[#443523]";
  const cardSurface = isDarkMode
    ? "border-[#39342B] bg-[#211F1B]"
    : "border-[#E9E4D8] bg-white";
  const mutedText = isDarkMode ? "text-[#C9C1B5]" : "text-[#8A8174]";
  const salonHour = Number(new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    hourCycle: "h23",
  }).format(new Date()));

  const calendarDays = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstWeekday = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
    const days = new Date(year, monthIndex + 1, 0).getDate();
    return [
      ...Array(firstWeekday).fill(null),
      ...Array.from({ length: days }, (_, index) => index + 1),
    ];
  }, [month]);

  const navigateMember = (page, beforeNavigate = () => {}) => {
    guardNavigation(() => {
      beforeNavigate();
      setActivePage(page);
    });
  };

  const openServices = () => navigateMember("member-services");

  const openBookings = () => {
    navigateMember("member-bookings");
  };

  return (
    <div
      className={`min-h-screen pb-24 lg:pb-0 lg:flex ${surface} transition-colors duration-300`}
    >
      {/* Desktop Sidebar (Compact) */}
      <aside
        className={`relative z-50 hidden shrink-0 flex-col border-r transition-all duration-300 ease-in-out select-none lg:sticky lg:top-0 lg:flex lg:h-screen ${
          isSidebarCollapsed ? "w-20" : "w-56"
        } ${isDarkMode ? "border-[#39342B] bg-[#1D1A16]" : "border-[#E7DFD4] bg-[#FFFDF8]"}`}
      >
        {/* Toggle Collapse Button */}
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed((prev) => !prev)}
          className={`absolute -right-3 top-6 z-20 flex h-6 w-6 items-center justify-center rounded-full border text-xs shadow-md transition-transform hover:scale-110 active:scale-95 ${isDarkMode ? "border-[#51493B] bg-[#29251E] text-[#F1E7C6]" : "border-[#E7DFD4] bg-white text-[#443523]"}`}
          aria-label="Toggle Sidebar"
        >
          <span
            className={`transition-transform duration-300 ${isSidebarCollapsed ? "rotate-180" : ""}`}
          >
            ‹
          </span>
        </button>

        {/* Logo Section */}
        <div className={`flex flex-col items-center border-b pt-6 pb-4 ${isDarkMode ? "border-[#39342B]" : "border-[#E7DFD4]"}`}>
          <div className="flex items-center gap-3 rounded-xl px-2 py-1">
            <img
              src="/logo.png"
              alt="Centy'zz Salon"
              className="h-10 w-10 shrink-0 object-contain"
            />
            {!isSidebarCollapsed && (
              <div className="flex min-w-0 flex-col justify-center text-left leading-none">
                <span className={`block text-[1.2rem] font-bold uppercase ${isDarkMode ? "text-[#F5F1EA]" : "text-[#2A1E1B]"}`}>
                  Centy'zz
                </span>
                <span className="block pt-0.5 text-[8px] font-medium uppercase tracking-[0.25em] text-[#C5A059]">
                  Hair &amp; Beauty
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Member Profile Badge */}
        <div className={`flex flex-col items-center border-b px-2 py-4 ${isDarkMode ? "border-[#39342B]" : "border-[#E7DFD4]"}`}>
          <div className="group relative flex w-full flex-col items-center rounded-2xl px-2 py-1">
            <div className="relative">
              <div role="img" aria-label={`${fullName} profile`} className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-[#C5A059] bg-[#4A3928] text-sm font-bold text-[#C5A059] shadow-sm">
                {profilePhoto ? <img src={profilePhoto} alt="" className="h-full w-full rounded-full object-cover" /> : (initials || "M")}
              </div>
              {!isSidebarCollapsed && <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[9px] font-extrabold shadow-2xs ${isDarkMode ? "border-[#51493B] bg-[#3A3023] text-[#D9B66C]" : "border-[#D8C2A0] bg-[#EBDBC8] text-[#8C6D3B]"}`}>CLIENT</span>}
            </div>
            {!isSidebarCollapsed && <div className="mt-3 w-full px-2 text-center"><h2 className={`truncate text-xs font-bold ${isDarkMode ? "text-[#F5F1EA]" : "text-[#2A1E1B]"}`}>{fullName}</h2><p className={`truncate text-[9px] ${mutedText}`}>{user?.email || "Email not provided"}</p></div>}
          </div>
        </div>

        {/* Navigation Items */}
        <nav
          aria-label="Member navigation"
          className="flex-1 overflow-y-auto px-3 py-3 space-y-1 custom-scrollbar"
        >
          {[
            {
              id: "home",
              label: "Home",
              icon: Home,
              action: () => {
                navigateMember("home", () => {
                  setActiveSection("home");
                  setEditingProfile(false);
                  setProfileDraft({
                    firstName: accountProfile.firstName || "",
                    lastName: accountProfile.lastName || "",
                  });
                  setProfileMessage(null);
                });
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
              action: () => navigateMember("member-account"),
            },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                className={`w-full flex items-center p-2.5 rounded-xl transition-all duration-200 active:scale-95 ${
                  isActive
                    ? "bg-[#3A342B] text-white shadow-md font-semibold"
                    : isDarkMode
                      ? "text-[#C9C1B5] hover:bg-[#C5A059]/15 hover:text-[#F1E7C6]"
                      : "text-[#443523] hover:bg-[#C5A059]/15 hover:text-[#4A3928]"
                } ${isSidebarCollapsed ? "justify-center" : "justify-start gap-3"}`}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <Icon size={18} className={isActive ? "text-white" : isDarkMode ? "text-[#C9C1B5]" : "text-[#443523]"} />
                {!isSidebarCollapsed && (
                  <span className="text-xs font-medium truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className={`p-3 border-t ${isDarkMode ? "border-[#39342B]" : "border-[#E7DFD4]"}`}>
          <button
            type="button"
            onClick={() => setConfirmLogout(true)}
            className={`w-full flex items-center p-2.5 rounded-xl transition-all duration-200 active:scale-95 ${isDarkMode ? "text-red-300 hover:bg-red-500/10 hover:text-red-200" : "text-red-600 hover:bg-red-50 hover:text-red-700"} ${isSidebarCollapsed ? "justify-center" : "justify-start gap-3"}`}
            title={isSidebarCollapsed ? "Log Out" : undefined}
          >
            <LogOut size={18} />
            {!isSidebarCollapsed && <span className="text-xs font-bold truncate">Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-w-0 flex-1 px-3 py-4 transition-all duration-300 sm:px-6 sm:py-5 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Account page header */}
          {activeSection === "account" && <header className="mb-6 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold">Account Settings</h1>
              <p className={`mt-0.5 truncate text-xs ${mutedText}`}>Manage your personal information and account details.</p>
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
          </header>}

          {showNotifications && (
            <div
              role="status"
              className={`mb-4 rounded-xl border p-3.5 text-xs transition-all duration-300 ${cardSurface}`}
            >
              You’re all caught up. New booking updates will appear here.
            </div>
          )}

          {activeSection === "account" ? (
            <section className="space-y-6 pb-6">
              <div className={`flex flex-col items-center justify-between gap-6 rounded-2xl border p-6 shadow-sm sm:flex-row ${cardSurface}`}>
                <div className="flex min-w-0 items-center gap-5">
                    <button type="button" aria-label="Manage profile photo" title="Manage profile photo" onClick={() => setIsPhotoModalOpen(true)} className="group relative h-20 w-20 shrink-0">
                      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-4 border-[#C5A059]/30 bg-[#4A3928] text-2xl font-bold text-[#C5A059] shadow-md">
                        {profilePhoto ? <img src={profilePhoto} alt={`${fullName} profile`} className="h-full w-full object-cover" /> : (initials || "M")}
                      </div>
                      <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"><Camera size={20} /></span>
                    </button>
                  <div className="min-w-0">
                    <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${isDarkMode ? "text-[#C5A059]" : "text-[#9A7946]"}`}>Member account</p>
                    <h2 className="mt-1 truncate text-2xl">{fullName}</h2>
                    <p className={`mt-0.5 truncate text-xs ${mutedText}`}>{accountProfile.email || "Email not provided"}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
                  <button type="button" onClick={() => setIsPhotoModalOpen(true)} className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${isDarkMode ? "border-[#51493B] hover:bg-white/5" : "border-[#E9E4D8] hover:bg-black/5"}`}><Camera size={14} /> Edit photo</button>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold ${accountProfile.emailVerified ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                    {accountProfile.emailVerified ? <BadgeCheck size={13} /> : <ShieldCheck size={13} />}
                    {accountProfile.emailVerified ? "Verified email" : "Account active"}
                  </span>
                  {!editingProfile ? (
                    <button type="button" disabled={!user?.accessToken} onClick={() => { setProfileDraft({ firstName: accountProfile.firstName || "", lastName: accountProfile.lastName || "" }); setProfileMessage(null); setEditingProfile(true); }} className="inline-flex items-center gap-2 rounded-xl border border-[#C5A059]/50 bg-[#C5A059]/10 px-4 py-2.5 text-xs font-bold text-[#9A7946] transition hover:bg-[#C5A059]/20 disabled:cursor-not-allowed disabled:opacity-50"><Pencil size={14} /> Edit profile</button>
                  ) : (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => { setEditingProfile(false); setProfileDraft({ firstName: accountProfile.firstName || "", lastName: accountProfile.lastName || "" }); setProfileMessage(null); markSaved(profileScope); }} className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold ${isDarkMode ? "border-[#51493B]" : "border-[#E9E4D8]"}`}><X size={14} /> Cancel</button>
                      <button type="button" disabled={savingProfile || !profileDraft.firstName.trim() || !profileDraft.lastName.trim()} onClick={() => setShowSaveConfirmation(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-[#C5A059]/30 bg-[#3A342B] px-5 py-2.5 text-xs font-bold text-[#F5F1EA] shadow-md transition-all hover:bg-[#2A241B] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"><Save size={14} /> {savingProfile ? "Saving…" : "Save changes"}</button>
                    </div>
                  )}
                </div>
              </div>

              {profileMessage && <p role={profileMessage.type === "error" ? "alert" : "status"} className={`rounded-2xl border px-4 py-3 text-xs font-medium ${profileMessage.type === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{profileMessage.text}</p>}

              <div className={`rounded-2xl border p-6 shadow-sm sm:p-8 ${cardSurface}`}>
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(250px,0.8fr)]">
                <div className="space-y-6">
                  <div>
                    <h3 className={`mb-1 text-sm font-bold uppercase tracking-wider ${isDarkMode ? "text-[#F5F1EA]" : "text-[#2A1E1B]"}`}>Personal Details</h3>
                    <p className={`text-xs ${mutedText}`}>Update your profile information used for bookings and account communications.</p>
                    {accountLoading && <span className={`text-[10px] ${mutedText}`}>Refreshing…</span>}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block"><span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#8A8174]">First Name</span><input maxLength={100} disabled={!editingProfile} value={editingProfile ? profileDraft.firstName : accountProfile.firstName || ""} onChange={(event) => { setProfileDraft((draft) => ({ ...draft, firstName: event.target.value })); markDirty(profileScope); }} className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-medium outline-none focus:border-[#C5A059] disabled:cursor-not-allowed disabled:opacity-80 ${isDarkMode ? "border-[#51493B] bg-[#211F1B] text-[#F5F1EA]" : "border-[#E9E4D8] bg-[#FFFDF8] text-[#2A1E1B]"}`} /></label>
                    <label className="block"><span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#8A8174]">Last Name</span><input maxLength={100} disabled={!editingProfile} value={editingProfile ? profileDraft.lastName : accountProfile.lastName || ""} onChange={(event) => { setProfileDraft((draft) => ({ ...draft, lastName: event.target.value })); markDirty(profileScope); }} className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-medium outline-none focus:border-[#C5A059] disabled:cursor-not-allowed disabled:opacity-80 ${isDarkMode ? "border-[#51493B] bg-[#211F1B] text-[#F5F1EA]" : "border-[#E9E4D8] bg-[#FFFDF8] text-[#2A1E1B]"}`} /></label>
                    <label className="block sm:col-span-2"><span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#8A8174]">Email Address</span><input readOnly value={accountProfile.email || ""} className={`w-full cursor-not-allowed rounded-xl border px-3.5 py-2.5 text-xs font-medium opacity-80 ${isDarkMode ? "border-[#51493B] bg-[#211F1B] text-[#F5F1EA]" : "border-[#E9E4D8] bg-[#F6F4EF] text-[#8A8174]"}`} /><span className={`mt-1 block text-[10px] text-[#8A8174]`}>Email changes require a verification flow.</span></label>
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
              </div>
            </section>
          ) : (
            <>
              <div className="space-y-5">
                <header className="flex flex-wrap items-center justify-between gap-4 px-1">
                  <div className="min-w-0">
                    <h2 className="truncate text-xl font-bold sm:text-2xl">Good {salonHour < 12 ? "Morning" : salonHour < 18 ? "Afternoon" : "Evening"}, {name}!</h2>
                    <p className={`mt-0.5 text-xs ${mutedText}`}>Today is {new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date())}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setIsDarkMode((current) => !current)} aria-label="Toggle dark mode" title="Toggle dark mode" className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition hover:border-[#C5A059] ${cardSurface}`}>
                      {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </button>
                    <button type="button" onClick={openServices} aria-label="Browse services" title="Browse services" className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition hover:border-[#C5A059] ${cardSurface}`}>
                      <Search className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => setShowNotifications((value) => !value)} aria-label="Notifications" title="Notifications" className={`relative flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition hover:border-[#C5A059] ${cardSurface}`}>
                      <Bell className="h-4 w-4" />
                    </button>
                  </div>
                </header>

                <section className={`rounded-[18px] p-3 sm:p-4 ${isDarkMode ? "bg-[#29251E]" : "bg-[#EAE6B9]"}`}>
                  <div className="grid gap-3 lg:grid-cols-[minmax(150px,0.9fr)_minmax(0,3fr)] lg:items-stretch">
                    <div className="flex flex-col items-start justify-center px-1 py-2 sm:px-2">
                      <h3 className="text-lg font-bold leading-tight sm:text-xl">Today’s Popular Picks</h3>
                      <p className={`mt-1 max-w-[15rem] text-xs leading-snug ${isDarkMode ? "text-[#C9C1B5]" : "text-[#655943]"}`}>Here’s what you can do next to glam your beauty routine!</p>
                      <button type="button" onClick={openServices} className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold shadow-sm transition ${isDarkMode ? "bg-[#F1E7C6] text-[#3A3023] hover:bg-white" : "bg-[#FFFDF8] text-[#4A3928] hover:bg-white"}`}>
                        See all <span aria-hidden="true">↗</span>
                      </button>
                    </div>

                    <div className="grid min-w-0 gap-3 sm:grid-cols-3">
                      {POPULAR_SERVICES.map((service) => (
                        <button key={service.title} type="button" onClick={() => onOpenBooking?.({ title: service.title, category: service.category })} className={`flex min-h-32 flex-col justify-between rounded-xl p-3 text-left shadow-sm transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C5A059] sm:min-h-36 sm:p-3.5 ${service.color}`}>
                          <span>
                            <span className="block text-base font-bold leading-tight sm:text-lg">{service.label}</span>
                            <span className="mt-0.5 block text-[10px] opacity-80">{service.kind}</span>
                          </span>
                          <span className="mt-3 border-t border-current/15 pt-2 text-[10px] leading-tight opacity-85">{service.title}<span className="mt-0.5 block font-medium">Book this service →</span></span>
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_250px]">
                  <section className="min-w-0">
                    <div className="mb-3 flex items-center justify-between gap-3 px-1">
                      <h3 className="text-base font-bold">Past Services</h3>
                      <button type="button" onClick={openBookings} className="shrink-0 text-[11px] font-medium text-[#B4833F] hover:underline">View all</button>
                    </div>

                    <div className={`overflow-hidden rounded-[18px] border shadow-sm ${isDarkMode ? "border-[#39342B] bg-[#211F1B]" : "border-[#EFE8D6] bg-[#FFFCEE]"}`}>
                      <div className={`hidden grid-cols-[minmax(0,1fr)_70px_110px] gap-3 border-b px-4 py-2.5 text-[10px] sm:grid ${isDarkMode ? "border-[#39342B] text-[#C9C1B5]" : "border-[#E7DFD4] text-[#84765F]"}`}>
                        <span>Service Name</span><span>Date</span><span>Stylist</span>
                      </div>
                      {appointmentsError ? (
                        <p role="alert" className="px-4 py-5 text-sm text-red-500">{appointmentsError}</p>
                      ) : isLoadingAppointments ? (
                        <p role="status" className={`px-4 py-5 text-sm ${mutedText}`}>Loading past services…</p>
                      ) : pastAppointments.length === 0 ? (
                        <p className={`px-4 py-5 text-sm ${mutedText}`}>No past services yet.</p>
                      ) : pastAppointments.map((appointment, index) => (
                        <div key={appointment.id ?? `${dateKey(appointment.appointmentDate)}-${index}`} className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-3 py-2.5 text-xs sm:grid-cols-[minmax(0,1fr)_70px_110px] sm:px-4 ${index ? (isDarkMode ? "border-t border-[#39342B]" : "border-t border-[#E7DFD4]") : ""}`}>
                          <div className="flex min-w-0 items-center gap-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#4A3928] text-[#F4D59B]"><CalendarDays className="h-4 w-4" /></div>
                            <div className="min-w-0">
                              <p className="truncate font-medium">{appointment.service?.name || appointment.services?.map((service) => service.name).join(", ") || "Service unavailable"}</p>
                              <p className={`truncate text-[10px] ${mutedText}`}>{String(appointment.status || "").toLowerCase()}</p>
                            </div>
                          </div>
                          <span className="text-[10px] sm:text-xs">{formatAppointmentDate(appointment.appointmentDate)}</span>
                          <span className={`col-span-2 truncate text-[10px] sm:col-span-1 sm:text-xs ${mutedText}`}>{appointment.stylist?.name || appointment.stylistName || "Not assigned"}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <aside className={`rounded-[16px] border p-3.5 shadow-sm ${isDarkMode ? "border-[#39342B] bg-[#211F1B]" : "border-[#E7E4DA] bg-white"}`}>
                    <div className="mb-2 flex items-center justify-center">
                      <h3 className="text-xs font-semibold">{formatMonth(month)}</h3>
                    </div>
                    <div className={`grid grid-cols-7 gap-0.5 text-center text-[8px] font-medium ${mutedText}`}>
                      {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => <span key={day} className="py-1.5">{day}</span>)}
                      {calendarDays.map((day, index) => {
                        if (!day) return <span key={`${month.getMonth()}-blank-${index}`} className="h-7" />;
                        const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                        const isToday = key === todayDate;
                        const hasAppointment = upcomingAppointments.some((appointment) => dateKey(appointment.appointmentDate) === key);
                        return <span key={key} className={`relative flex h-7 items-center justify-center rounded-full text-[9px] ${isToday ? "bg-[#4A3928] font-bold text-white" : isDarkMode ? "text-[#E5DED3]" : "text-[#52463E]"}`}>{day}{hasAppointment && <span className={`absolute bottom-0.5 h-1 w-1 rounded-full ${isToday ? "bg-[#F1E7C6]" : "bg-[#B4833F]"}`} />}</span>;
                      })}
                    </div>
                    <button type="button" onClick={() => onOpenBooking?.()} className="mt-3 w-full rounded-full bg-[#4A3928] px-3 py-2.5 text-[10px] font-semibold text-white shadow-sm transition hover:bg-[#725334]">
                      Book an Appointment
                    </button>
                  </aside>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Floating Oval Bottom Navigation Bar (Mobile Only) */}
      <div className="fixed bottom-3 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 lg:hidden">
        <nav
          aria-label="Mobile Navigation"
          className={`flex items-center justify-around rounded-full border px-2 py-1.5 text-white shadow-xl backdrop-blur-md transition-all duration-300 ${isDarkMode ? "border-[#51493B] bg-[#1D1A16]/95" : "border-white/10 bg-[#4A3928]/95"}`}
        >
          {[
            {
              id: "home",
              label: "Home",
              icon: Home,
              action: () => navigateMember("home", () => setActiveSection("home")),
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
              action: () => navigateMember("member-account"),
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

      <ProfilePictureModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        currentImageUrl={profilePhoto}
        onUpload={saveProfilePhoto}
        onRemove={() => setConfirmPhotoRemoval(true)}
        isDarkMode={isDarkMode}
      />
      <SaveChangesModal
        isOpen={showSaveConfirmation}
        isDarkMode={isDarkMode}
        onCancel={() => setShowSaveConfirmation(false)}
        onConfirm={() => {
          setShowSaveConfirmation(false);
          void saveProfile();
        }}
      />
      {confirmPhotoRemoval && <ConfirmationModal title="Remove profile photo?" message="Your current profile photo will be removed from this device." confirmLabel="Remove photo" danger isDarkMode={isDarkMode} onCancel={() => setConfirmPhotoRemoval(false)} onConfirm={removeProfilePhoto} />}
      {confirmLogout && <ConfirmationModal title="Log out?" message="Are you sure you want to log out of your account?" confirmLabel="Log out" danger isDarkMode={isDarkMode} onCancel={() => setConfirmLogout(false)} onConfirm={() => { setConfirmLogout(false); onLogout?.(); }} />}
    </div>
  );
}
