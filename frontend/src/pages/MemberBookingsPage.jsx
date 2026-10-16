import { useState } from "react";
import {
  Bell,
  CalendarDays,
  CalendarPlus,
  Clock,
  Tag,
  Home,
  LogOut,
  Moon,
  Scissors,
  Search,
  Sun,
  User,
  UserRound,
  XCircle,
  AlertCircle,
  X,
} from "lucide-react";

const UPCOMING_BOOKINGS = [
  {
    id: "BK-001",
    ref: "#A-78402",
    service: "Balayage & Color Gloss",
    stylist: "Senior Artist - Marco",
    date: "2026-09-15",
    time: "10:00 AM",
    duration: "2.0 hrs",
    location: "Centy'zz Salon - Main Branch",
    price: "₱185",
    status: "confirmed",
  },
  {
    id: "BK-002",
    ref: "#A-78403",
    service: "Luxury Spa Pedicure",
    stylist: "Nail Technician - Lisa",
    date: "2026-09-22",
    time: "02:30 PM",
    duration: "60 mins",
    location: "Centy'zz Salon - Main Branch",
    price: "₱70",
    status: "confirmed",
  },
  {
    id: "BK-003",
    ref: "#A-78404",
    service: "Precision Cut & Blowout",
    stylist: "Senior Artist - Jin",
    date: "2026-10-05",
    time: "11:00 AM",
    duration: "1.0 hr",
    location: "Centy'zz Salon - Main Branch",
    price: "₱75",
    status: "pending",
  },
];

const PAST_BOOKINGS = [
  {
    id: "BK-004",
    ref: "#A-78401",
    service: "Hair Cut",
    stylist: "Senior Stylist - Karl",
    date: "2026-08-31",
    time: "11:00 AM",
    duration: "90 mins",
    price: "₱698.00",
    status: "completed",
  },
  {
    id: "BK-005",
    ref: "#A-78400",
    service: "Basic Hair Color",
    stylist: "Senior Stylist - Karl",
    date: "2026-08-31",
    time: "11:00 AM",
    duration: "90 mins",
    price: "₱698.00",
    status: "completed",
  },
  {
    id: "BK-006",
    ref: "#A-78399",
    service: "Signature Foot Spa",
    stylist: "Nail Technician - Lisa",
    date: "2026-09-16",
    time: "02:00 PM",
    duration: "60 mins",
    price: "₱70",
    status: "cancelled",
  },
];

export default function MemberBookingsPage({
  user,
  isDarkMode,
  setIsDarkMode,
  setActivePage,
  onOpenBooking,
  onLogout,
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [pastFilter, setPastFilter] = useState("completed");
  const [selectedBooking, setSelectedBooking] = useState(null);

  const fullName = user?.fullName || user?.name || "Jennie Baby Jane";
  const username = user?.username || "@jenniebabyjanepetitehome";

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

  const openServices = () => setActivePage("member-services");

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatShortDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    if (status === "confirmed" || status === "completed") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F0EA] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#3A5A40]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#3A5A40]"></span>
          {status}
        </span>
      );
    }
    if (status === "pending") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-700">
          <AlertCircle className="w-3 h-3" /> Pending
        </span>
      );
    }
    if (status === "cancelled") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-red-600">
          <XCircle className="w-3 h-3" /> Cancelled
        </span>
      );
    }
    return null;
  };

  const filteredPastBookings = PAST_BOOKINGS.filter(
    (b) => b.status === pastFilter,
  );

  const handleOpenModal = (booking) => {
    setSelectedBooking(booking);
  };

  const handleCloseModal = () => {
    setSelectedBooking(null);
  };

  return (
    <div
      className={`min-h-screen pb-24 lg:pb-0 lg:flex ${surface} transition-colors duration-300`}
    >
      <aside
        className={`relative hidden lg:flex shrink-0 flex-col border-r lg:sticky lg:top-0 lg:h-screen transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "w-20" : "w-48"
        } ${sidebarSurface}`}
      >
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

        <div className="flex flex-col items-center justify-center border-b border-inherit py-4 px-2 text-center transition-all duration-300">
          <img
            src={
              user?.avatar ||
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
            }
            alt={fullName}
            className={`rounded-full object-cover border-2 border-[#C5A059] transition-all duration-300 ${
              isSidebarCollapsed ? "h-9 w-9" : "h-12 w-12 mb-2"
            }`}
          />
          {!isSidebarCollapsed && (
            <div className="w-full px-2">
              <span className="inline-block rounded-full bg-[#E8D9C2]/50 px-2 py-0.5 text-[9px] font-medium text-[#6F4C25] mb-1">
                Exclusive Member
              </span>
              <p className="text-xs font-bold truncate">{fullName}</p>
              <p className={`text-[9px] truncate ${mutedText}`}>{username}</p>
            </div>
          )}
        </div>

        <nav
          aria-label="Member navigation"
          className="flex flex-1 flex-col gap-1.5 p-3"
        >
          {[
            {
              id: "home",
              label: "Home",
              icon: Home,
              action: () => setActivePage("home"),
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
              action: () => {},
            },
            {
              id: "account",
              label: "Account",
              icon: UserRound,
              action: () => setActivePage("member-account"),
            },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = item.id === "booking";
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

      <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 transition-all duration-300">
        <div className="mx-auto max-w-4xl">
          <header className="mb-6 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl font-bold truncate">My Bookings</h1>
              <p className={`mt-0.5 text-xs ${mutedText} truncate`}>
                Today is Sunday, August 20 2026
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
              You're all caught up. New booking updates will appear here.
            </div>
          )}

          {/* Main Tabs */}
          <div className="flex items-center gap-6 border-b border-[#E9E4D8] mb-6">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`pb-3 text-sm font-semibold transition-colors relative ${
                activeTab === "upcoming"
                  ? "text-[#443523]"
                  : "text-[#8A8174] hover:text-[#443523]"
              }`}
            >
              Upcoming Appointments
              {activeTab === "upcoming" && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#443523]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("past")}
              className={`pb-3 text-sm font-semibold transition-colors relative ${
                activeTab === "past"
                  ? "text-[#443523]"
                  : "text-[#8A8174] hover:text-[#443523]"
              }`}
            >
              Past Appointments
              {activeTab === "past" && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#443523]" />
              )}
            </button>
          </div>

          {/* Upcoming Tab Content */}
          {activeTab === "upcoming" && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold">Upcoming Appointments</h2>
                <button
                  type="button"
                  onClick={() => onOpenBooking(null)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#B4833F] hover:underline transition-colors"
                >
                  <CalendarPlus className="h-3.5 w-3.5" />
                  Book New
                </button>
              </div>

              {UPCOMING_BOOKINGS.length === 0 ? (
                <div
                  className={`text-center py-20 rounded-2xl border transition-all duration-300 ${cardSurface}`}
                >
                  <CalendarDays
                    className={`w-12 h-12 mx-auto mb-3 ${mutedText}`}
                  />
                  <p className={`text-sm ${mutedText}`}>
                    No upcoming appointments.
                  </p>
                  <button
                    type="button"
                    onClick={() => onOpenBooking(null)}
                    className="mt-3 text-xs font-semibold text-[#B4833F] hover:underline transition-colors"
                  >
                    Book your first appointment
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {UPCOMING_BOOKINGS.map((booking) => (
                    <div
                      key={booking.id}
                      className={`rounded-2xl border p-5 shadow-sm transition-all duration-300 ${cardSurface}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-[#8A8174]">
                          {formatShortDate(booking.date)}
                        </span>
                        <button
                          onClick={() => handleOpenModal(booking)}
                          className="text-[#8A8174] hover:text-[#443523] transition-colors"
                        >
                          <span className="text-lg font-bold">···</span>
                        </button>
                      </div>
                      <div className="border-t border-[#E9E4D8] mb-4" />
                      <div className="flex gap-6">
                        <div className="w-20 shrink-0">
                          <p className="text-sm font-bold">{booking.time}</p>
                        </div>
                        <div className="flex-1 space-y-3">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A8174]">
                              Hair Service
                            </p>
                            <p className="text-sm font-bold">
                              {booking.service}
                            </p>
                          </div>
                          {booking.id === "BK-001" && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A8174]">
                                Hair Service
                              </p>
                              <p className="text-sm font-bold">
                                Basic Hair Color
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Past Tab Content */}
          {activeTab === "past" && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setPastFilter("completed")}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    pastFilter === "completed"
                      ? "bg-[#443523] text-white"
                      : "bg-[#E9E4D8] text-[#443523] hover:bg-[#D9D4C8]"
                  }`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setPastFilter("cancelled")}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    pastFilter === "cancelled"
                      ? "bg-[#443523] text-white"
                      : "bg-[#E9E4D8] text-[#443523] hover:bg-[#D9D4C8]"
                  }`}
                >
                  Cancelled
                </button>
              </div>

              {filteredPastBookings.length === 0 ? (
                <div
                  className={`text-center py-20 rounded-2xl border transition-all duration-300 ${cardSurface}`}
                >
                  <CalendarDays
                    className={`w-12 h-12 mx-auto mb-3 ${mutedText}`}
                  />
                  <p className={`text-sm ${mutedText}`}>
                    No {pastFilter} appointments found.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPastBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className={`rounded-2xl border p-5 shadow-sm transition-all duration-300 ${cardSurface}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-[#8A8174]">
                          {formatShortDate(booking.date)}
                        </span>
                        <button
                          onClick={() => handleOpenModal(booking)}
                          className="text-[#8A8174] hover:text-[#443523] transition-colors"
                        >
                          <span className="text-lg font-bold">···</span>
                        </button>
                      </div>
                      <div className="border-t border-[#E9E4D8] mb-4" />
                      <div className="flex gap-6">
                        <div className="w-20 shrink-0">
                          <p className="text-sm font-bold">{booking.time}</p>
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A8174]">
                            {booking.status === "cancelled"
                              ? "Cancelled Service"
                              : "Service"}
                          </p>
                          <p className="text-sm font-bold">{booking.service}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {/* Appointment Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div
            className={`w-full max-w-3xl rounded-3xl border shadow-2xl transition-all duration-300 overflow-hidden ${cardSurface}`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E9E4D8]">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#8A8174]" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#8A8174]">
                  Booking Details
                </h2>
              </div>
              <button
                onClick={handleCloseModal}
                className={`p-1.5 rounded-full transition-colors ${
                  isDarkMode
                    ? "hover:bg-[#3A3A3A] text-[#C9C1B5]"
                    : "hover:bg-[#F6F4EF] text-[#8A8174]"
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex flex-col md:flex-row">
              {/* Left Column - Service Details */}
              <div
                className={`flex-1 p-6 md:p-8 border-b md:border-b-0 md:border-r border-[#E9E4D8] ${
                  isDarkMode ? "bg-[#1D1A16]" : "bg-[#FDFBF7]"
                }`}
              >
                {/* Service Card */}
                <div
                  className={`rounded-2xl p-5 mb-6 ${
                    isDarkMode ? "bg-[#2A2723]" : "bg-[#F3EFE7]"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    {getStatusBadge(selectedBooking.status)}
                    <span className="text-[10px] font-medium text-[#8A8174]">
                      Ref: {selectedBooking.ref || "#A-00000"}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-4 leading-tight">
                    {selectedBooking.service}
                  </h3>
                  <div className="flex items-center gap-6 text-xs text-[#8A8174]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{selectedBooking.duration || "60 mins"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      <span>{selectedBooking.price || "₱0.00"}</span>
                    </div>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-[#8A8174]" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8174]">
                      Date & Time
                    </span>
                  </div>
                  <p className="text-sm font-bold">
                    {formatDate(selectedBooking.date)} at {selectedBooking.time}
                  </p>
                </div>

                {/* Stylist */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-3.5 h-3.5 text-[#8A8174]" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8174]">
                      Stylist
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"
                      alt="Stylist"
                      className="w-10 h-10 rounded-full object-cover border border-[#E9E4D8]"
                    />
                    <div>
                      <p className="text-sm font-bold">
                        {selectedBooking.stylist || "Karl Maverick Anonuevo"}
                      </p>
                      <p className="text-[10px] text-[#8A8174]">
                        Senior Stylist
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Guest Details */}
              <div className="flex-1 p-6 md:p-8 flex flex-col">
                <div className="mb-6">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-3">
                    Guest
                  </h4>
                  <p className="text-sm font-bold mb-1">{fullName}</p>
                  <p className="text-xs text-[#8A8174] mb-0.5">
                    {user?.email || "blackwidow@gmail.com"}
                  </p>
                  <p className="text-xs text-[#8A8174]">
                    {user?.phone || "+1 (555) 382-9012"}
                  </p>
                </div>

                <div className="mb-8">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-3">
                    Special Request & Notes
                  </h4>
                  <textarea
                    className={`w-full h-24 rounded-xl border p-3 text-xs resize-none focus:outline-none focus:border-[#C5A059] transition-colors ${
                      isDarkMode
                        ? "bg-[#2A2723] border-[#39342B] text-[#F5F1EA]"
                        : "bg-[#FDFBF7] border-[#E9E4D8] text-[#443523]"
                    }`}
                    placeholder="No special requests."
                    disabled
                  />
                </div>

                {/* Actions */}
                <div className="mt-auto flex gap-3">
                  {selectedBooking.status === "confirmed" ||
                  selectedBooking.status === "pending" ? (
                    <>
                      <button
                        onClick={handleCloseModal}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 ${
                          isDarkMode
                            ? "bg-[#2A2A2A] text-[#F5F1EA] hover:bg-[#3A3A3A]"
                            : "bg-[#F6F4EF] text-[#443523] hover:bg-[#E9E4D8]"
                        }`}
                      >
                        Cancel Appointment
                      </button>
                      <button
                        onClick={handleCloseModal}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 border ${
                          isDarkMode
                            ? "border-[#39342B] text-[#F5F1EA] hover:bg-[#2A2723]"
                            : "border-[#E9E4D8] text-[#443523] hover:bg-[#F6F4EF]"
                        }`}
                      >
                        Close Tab
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleCloseModal}
                      className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 ${
                        isDarkMode
                          ? "bg-[#2A2A2A] text-[#F5F1EA] hover:bg-[#3A3A3A]"
                          : "bg-[#F6F4EF] text-[#443523] hover:bg-[#E9E4D8]"
                      }`}
                    >
                      Close
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
              action: () => setActivePage("home"),
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
              action: () => {},
            },
            {
              id: "account",
              label: "Account",
              icon: UserRound,
              action: () => setActivePage("member-account"),
            },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = item.id === "booking";
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
