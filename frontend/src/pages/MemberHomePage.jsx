import { useMemo, useState } from "react";
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
} from "lucide-react";

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
  initialSection = "home",
  appointments = [],
  isLoadingAppointments,
  appointmentsError,
}) {
  const [month, setMonth] = useState(() => new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeSection, setActiveSection] = useState(initialSection);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

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
            {initials || "M"}
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
              action: () => setActiveSection("account"),
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
      <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 transition-all duration-300">
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
                className={`rounded-full border p-2.5 ${cardSurface} hover:border-[#C5A059] transition-all duration-200 active:scale-95 shadow-sm`}
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
                className={`rounded-full border p-2.5 ${cardSurface} hover:border-[#C5A059] transition-all duration-200 active:scale-95 shadow-sm`}
              >
                <Search className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowNotifications((val) => !val)}
                aria-label="Notifications"
                className={`rounded-full border p-2.5 ${cardSurface} hover:border-[#C5A059] transition-all duration-200 active:scale-95 shadow-sm relative`}
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
            <section
              className={`rounded-2xl border p-6 transition-all duration-300 ${cardSurface}`}
            >
              <h2 className="font-serif text-2xl">Your Account</h2>
              <p className={`mt-1 text-xs ${mutedText}`}>
                Your member profile details.
              </p>
              <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className={mutedText}>Full Name</dt>
                  <dd className="mt-1 font-medium">{fullName}</dd>
                </div>
                <div>
                  <dt className={mutedText}>Email</dt>
                  <dd className="mt-1 font-medium">
                    {user?.email || "Not provided"}
                  </dd>
                </div>
                <div>
                  <dt className={mutedText}>Role</dt>
                  <dd className="mt-1 font-medium">{user?.role || "Member"}</dd>
                </div>
              </dl>
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
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 lg:hidden w-[90%] max-w-sm">
        <nav
          aria-label="Mobile Navigation"
          className="flex items-center justify-around rounded-full bg-[#4A3928]/95 backdrop-blur-md px-3 py-2 text-white shadow-xl border border-white/10 transition-all duration-300"
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
              action: () => setActiveSection("account"),
            },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                className={`relative flex flex-col items-center justify-center p-2 text-[10px] transition-all duration-200 active:scale-90 ${
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
    </div>
  );
}
