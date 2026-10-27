import { useEffect, useMemo, useState } from "react";
import useMemberSidebarState from "../hooks/useMemberSidebarState";
import { useUnsavedChanges } from "../components/UnsavedChangesProvider";
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
} from "lucide-react";
import { api } from "../api/client";
import ConfirmationModal from "../components/ConfirmationModal";
import ProfilePictureModal from "../components/ProfilePictureModal";
import SaveChangesModal from "../components/SaveChangesModal";

const formatMonth = (date) =>
  date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

const POPULAR_SERVICES = [
  {
    title: "Precision Cut & Blow-Dry",
    category: "hair",
    label: "Hair Cut",
    kind: "Hair Services",
    color: "bg-[#E8D4B8] text-[#4D3B2A]",
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
    color: "bg-[#D9D8B9] text-[#3F3A2A]",
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
  const [activeTab, setActiveTab] = useState("upcoming");
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
            onClick={() => setConfirmLogout(true)}
            className="flex w-full items-center justify-center lg:justify-start gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 active:scale-95"
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
              {activeSection === "account" ? (
                <>
                  <h1 className="truncate text-xl font-bold">Account Settings</h1>
                  <p className={`mt-0.5 truncate text-xs ${mutedText}`}>Manage your personal information and account details.</p>
                </>
              ) : (
                <>
                  <h1 className="truncate text-lg font-bold">
                    Good{" "}
                    {today.getHours() < 12
                      ? "Morning"
                      : today.getHours() < 18
                        ? "Afternoon"
                        : "Evening"}
                    , {name}!
                  </h1>
                  <p className={`mt-0.5 truncate text-[11px] ${mutedText}`}>
                    Today is{" "}
                    {today.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </>
              )}
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
              <div className="grid items-stretch gap-6 lg:grid-cols-12">
                <div className="flex flex-col gap-6 lg:col-span-5">
                  <section className={`min-w-0 overflow-hidden rounded-2xl border shadow-sm ${cardSurface}`}>
                  <div role="tablist" className={`flex border-b px-3 pt-3 sm:px-6 ${isDarkMode ? "border-[#39342B]" : "border-[#E9E4D8]"}`}>
                    {[
                      { id: "upcoming", label: "Your Upcoming Appointments" },
                      { id: "history", label: "Appointment History" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`min-h-12 flex-1 border-b-2 px-2 text-center text-xs font-semibold transition-colors sm:flex-none sm:px-4 ${
                          activeTab === tab.id
                            ? "border-[#B4833F] text-[#8A642F]"
                            : `border-transparent ${mutedText} hover:text-[#8A642F]`
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {activeTab === "upcoming" ? (
                    <div role="tabpanel" className="p-5 sm:p-6">
                      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h2 className="text-base font-bold">Your Upcoming Appointments</h2>
                          <p className={`mt-1 text-xs ${mutedText}`}>Booking details for your account.</p>
                        </div>
                        <button
                          type="button"
                          onClick={openBookings}
                          className="flex min-h-10 items-center gap-1.5 rounded-full border border-[#D5CEBF] bg-white px-4 text-[11px] font-medium text-[#443523] shadow-sm transition-all hover:border-[#C5A059] active:scale-95"
                        >
                          View bookings <span aria-hidden="true">→</span>
                        </button>
                      </div>
                      {appointmentsError ? (
                        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700">{appointmentsError}</p>
                      ) : isLoadingAppointments ? (
                        <p role="status" className={`rounded-xl bg-[#F6F4EF] px-4 py-6 text-center text-xs ${mutedText}`}>Loading appointments...</p>
                      ) : upcomingAppointments.length === 0 ? (
                        <div className={`rounded-xl border border-dashed p-8 text-center ${isDarkMode ? "border-[#51493B]" : "border-[#E2DCCF]"}`}>
                          <CalendarDays className={`mx-auto mb-3 h-7 w-7 ${mutedText}`} />
                          <p className={`text-xs ${mutedText}`}>You don’t have any upcoming appointments.</p>
                        </div>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          {upcomingAppointments.map((appointment) => (
                            <div key={appointment.id} className={`rounded-xl border p-4 ${cardSurface}`}>
                              <p className="text-xs font-bold">{appointment.service?.name || "Service unavailable"}</p>
                              <p className={`mt-2 text-[11px] ${mutedText}`}>
                                {new Date(`${appointment.appointmentDate}T12:00:00+08:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {String(appointment.startTime).slice(0, 5)}
                              </p>
                              <p className={`mt-1 text-[10px] capitalize ${mutedText}`}>
                                {String(appointment.status).toLowerCase()}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div role="tabpanel" className="p-5 sm:p-6">
                      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h2 className="text-base font-bold">Appointment History</h2>
                          <p className={`mt-1 text-xs ${mutedText}`}>Your previous salon visits.</p>
                        </div>
                        <button
                          type="button"
                          onClick={openBookings}
                          className="text-xs font-medium text-[#B4833F] transition-colors hover:underline"
                        >
                          View All →
                        </button>
                      </div>
                      <div className={`overflow-hidden rounded-xl border ${isDarkMode ? "border-[#39342B]" : "border-[#E9E4D8]"}`}>
                        <div className={`hidden grid-cols-[minmax(0,1fr)_90px_110px] gap-2 border-b px-4 py-3 text-[10px] font-semibold text-[#9A907F] sm:grid ${isDarkMode ? "border-[#39342B]" : "border-[#E9E4D8]"}`}>
                          <span>Service Name</span>
                          <span>Date</span>
                          <span>Stylist</span>
                        </div>
                        {appointmentsError ? (
                          <p role="alert" className="px-4 py-3 text-xs text-red-700">{appointmentsError}</p>
                        ) : isLoadingAppointments ? (
                          <p role="status" className={`px-4 py-4 text-xs ${mutedText}`}>Loading appointment history...</p>
                        ) : pastAppointments.length === 0 ? (
                          <p className={`px-4 py-5 text-xs ${mutedText}`}>No past appointments yet.</p>
                        ) : pastAppointments.map((appointment, index) => (
                          <div
                            key={appointment.id}
                            className={`grid gap-2 px-4 py-3 text-xs transition-colors duration-150 hover:bg-[#C5A059]/5 sm:grid-cols-[minmax(0,1fr)_90px_110px] sm:items-center ${index ? "border-t border-inherit" : ""}`}
                          >
                            <div className="flex min-w-0 items-center gap-2.5">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#4A3928] text-white shadow-xs">
                                <CalendarDays className="h-4 w-4" />
                              </span>
                              <div className="min-w-0">
                                <span className="block truncate font-semibold text-xs">
                                  {appointment.service?.name || "Service unavailable"}
                                </span>
                                <span className={`text-[10px] capitalize ${mutedText}`}>
                                  {String(appointment.status).toLowerCase()}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs">
                              {new Date(`${appointment.appointmentDate}T12:00:00+08:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                            <span className="truncate text-xs">Not assigned</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  </section>

                  <section className={`rounded-2xl border p-6 shadow-sm ${cardSurface}`}>
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <div>
                        <h2 className="text-sm font-bold">Today’s Popular Picks</h2>
                        <p className={`mt-1 text-[11px] ${mutedText}`}>Explore salon favorites and book your next visit.</p>
                      </div>
                      <button
                        type="button"
                        onClick={openServices}
                        className="shrink-0 text-[11px] font-medium text-[#B4833F] hover:underline"
                      >
                        See all →
                      </button>
                    </div>
                    <div className="space-y-3">
                      {POPULAR_SERVICES.map((service) => (
                        <button
                          key={service.title}
                          type="button"
                          onClick={() => onOpenBooking({ title: service.title, category: service.category })}
                          className={`flex min-h-[96px] w-full flex-col justify-between rounded-xl p-3.5 text-left transition-transform hover:-translate-y-0.5 ${service.color}`}
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
                  </section>
                </div>

                <section className={`flex min-h-[620px] min-w-0 flex-col rounded-2xl border p-6 shadow-sm lg:col-span-7 ${cardSurface}`}>
                  <div className="mb-6 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold">Calendar</h2>
                      <p className={`mt-1 text-xs ${mutedText}`}>Plan your next salon visit.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                        aria-label="Previous month"
                        className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:border-[#C5A059] ${isDarkMode ? "border-[#39342B]" : "border-[#E9E4D8]"}`}
                      >
                        ‹
                      </button>
                      <h3 className="min-w-32 text-center text-sm font-bold">{formatMonth(month)}</h3>
                      <button
                        type="button"
                        onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                        aria-label="Next month"
                        className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:border-[#C5A059] ${isDarkMode ? "border-[#39342B]" : "border-[#E9E4D8]"}`}
                      >
                        ›
                      </button>
                    </div>
                  </div>
                  <div className={`mb-2 grid grid-cols-7 border-b pb-3 text-center text-xs font-semibold ${mutedText} ${isDarkMode ? "border-[#39342B]" : "border-[#E9E4D8]"}`}>
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
                      <span key={`${day}-${index}`}>{day}</span>
                    ))}
                  </div>
                  <div className="grid flex-1 auto-rows-fr grid-cols-7 gap-y-2 text-center text-sm">
                    {calendarDays.map((day, index) => (
                      <span
                        key={`${month.getMonth()}-${index}`}
                        className={`mx-auto flex h-10 w-10 items-center justify-center self-center rounded-full transition-all duration-200 ${
                          day === today.getDate() && month.getMonth() === today.getMonth() && month.getFullYear() === today.getFullYear()
                            ? "bg-[#4A3928] text-white font-bold shadow-xs"
                            : "hover:bg-[#C5A059]/15"
                        }`}
                      >
                        {day || ""}
                      </span>
                    ))}
                  </div>
                  <div className={`mt-6 border-t pt-5 ${isDarkMode ? "border-[#39342B]" : "border-[#E9E4D8]"}`}>
                    <button
                      type="button"
                      onClick={() => onOpenBooking()}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-[#4A3928] px-4 py-3.5 text-xs font-semibold text-white shadow-md transition-all duration-200 hover:bg-[#725334] active:scale-95"
                    >
                      <CalendarPlus className="h-4 w-4" /> Book an Appointment
                    </button>
                    <p className={`mt-3 flex items-center justify-center gap-1.5 text-[10px] ${mutedText}`}>
                      <Clock3 className="h-3 w-3" /> Salon hours: 9:00 AM – 6:00 PM
                    </p>
                  </div>
                </section>
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
        onCancel={() => setShowSaveConfirmation(false)}
        onConfirm={() => {
          setShowSaveConfirmation(false);
          void saveProfile();
        }}
      />
      {confirmPhotoRemoval && <ConfirmationModal title="Remove profile photo?" message="Your current profile photo will be removed from this device." confirmLabel="Remove photo" danger onCancel={() => setConfirmPhotoRemoval(false)} onConfirm={removeProfilePhoto} />}
      {confirmLogout && <ConfirmationModal title="Log out?" message="Are you sure you want to log out of your account?" confirmLabel="Log out" danger onCancel={() => setConfirmLogout(false)} onConfirm={() => { setConfirmLogout(false); onLogout?.(); }} />}
    </div>
  );
}
