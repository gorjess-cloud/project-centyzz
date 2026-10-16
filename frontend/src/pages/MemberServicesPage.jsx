import { useState } from "react";
import {
  CalendarDays,
  Check,
  Home,
  LogOut,
  Scissors,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import { SERVICES_DATA } from "../data/servicesData";

const SERVICE_FILTERS = [
  { id: "all", label: "All-services", icon: "grid" },
  { id: "cuts", label: "Cuts & Styling" },
  { id: "color", label: "Coloring & Highlights" },
  { id: "treatments", label: "Treatments" },
  { id: "nails", label: "Nail Services" },
  { id: "lashes", label: "Eyelashes" },
];

const BOOKING_SERVICE_DETAILS = {
  "hair-1": {
    title: "Haircut (Haircut / Trim)",
    category: "hair",
    price: 99,
    duration: "30 mins",
  },
  "hair-2": {
    title: "Creative Haircut & Styling",
    category: "hair",
    price: 150,
    duration: "40 mins",
  },
  "hair-3": {
    title: "Blowout / Hair Styling",
    category: "hair",
    price: 120,
    duration: "40 mins",
  },
  "hair-4": {
    title: "Basic Hair Color (Root Touch-up or Solid)",
    category: "hair",
    price: 599,
    duration: "60 mins",
  },
  "hair-5": {
    title: "Bleaching & Double Process",
    category: "hair",
    price: 1200,
    duration: "120 mins",
  },
  "hair-6": {
    title: "Balayage / Ombre Highlights",
    category: "hair",
    price: 1999,
    duration: "3 hours",
  },
  "hair-7": {
    title: "Brazilian Keratin Treatment",
    category: "hair",
    price: 799,
    duration: "1 hour",
  },
  "hair-8": {
    title: "Hair Botox Deep Conditioning",
    category: "hair",
    price: 999,
    duration: "1 hour",
  },
};

const getServiceFilter = (service) => {
  if (service.category === "nails") return "nails";
  if (["hair-1", "hair-2", "hair-3"].includes(service.id)) return "cuts";
  if (["hair-4", "hair-5", "hair-6"].includes(service.id)) return "color";
  return "treatments";
};

const formatPrice = (price) => `₱${Number(price).toLocaleString("en-PH")}`;

export default function MemberServicesPage({
  user,
  isDarkMode,
  setActivePage,
  onOpenBooking,
  onLogout,
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [cartService, setCartService] = useState(null);

  // Cart panel is hidden by default (false)
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const fullName = user?.fullName || user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Member";
  const initials = fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  const cardSurface = isDarkMode
    ? "border-[#39342B] bg-[#211F1B]"
    : "border-[#EFEAE0] bg-[#FAF8F5]";
  const mutedText = isDarkMode ? "text-[#C9C1B5]" : "text-[#8A8174]";
  const sidebarSurface = isDarkMode
    ? "border-[#39342B] bg-[#1D1A16]"
    : "border-[#E9E4D8] bg-[#FFFDF8]";
  const today = new Date();

  const filteredServices = SERVICES_DATA.filter((service) => {
    const matchesFilter =
      selectedFilter === "all" || getServiceFilter(service) === selectedFilter;
    const query = search.trim().toLowerCase();
    const matchesSearch =
      service.title.toLowerCase().includes(query) ||
      service.description.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  const handleAddToCart = (service, details) => {
    setCartService({ ...service, ...details });
  };

  const openBooking = () => {
    if (cartService) {
      onOpenBooking({
        title: cartService.title,
        category: cartService.category,
      });
    }
  };

  const desktopNav = [
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
      action: () => setActivePage("member-services"),
    },
    {
      id: "booking",
      label: "Booking",
      icon: CalendarDays,
      action: () => setActivePage("member-bookings"),
    },
    {
      id: "account",
      label: "Account",
      icon: UserRound,
      action: () => setActivePage("member-account"),
    },
  ];

  return (
    <div
      className={`min-h-screen pb-24 transition-colors duration-300 lg:flex lg:pb-0 ${isDarkMode ? "bg-[#171512] text-[#F5F1EA]" : "bg-[#F9F8F3] text-[#443523]"}`}
    >
      {/* Sidebar */}
      <aside
        className={`relative hidden shrink-0 flex-col border-r transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:flex lg:h-screen ${
          isSidebarCollapsed ? "w-20" : "w-48"
        } ${sidebarSurface}`}
      >
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
          className="absolute -right-3 top-6 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-[#E9E4D8] bg-white text-xs text-[#443523] shadow-md transition-transform hover:scale-110 active:scale-95"
          aria-label="Toggle Sidebar"
        >
          <span
            className={`transition-transform duration-300 ${isSidebarCollapsed ? "rotate-180" : ""}`}
          >
            ‹
          </span>
        </button>

        <div className="flex h-16 items-center justify-center border-b border-inherit px-4">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Centy'zz Salon"
              className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-[#C5A059]/20"
            />
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <span className="block truncate text-xs font-bold">
                  Centy'zz
                </span>
                <span className="block truncate text-[10px] text-[#8A8174]">
                  Hair & Beauty
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center border-b border-inherit px-2 py-4 text-center">
          <div
            role="img"
            aria-label={`${fullName} profile`}
            className={`flex items-center justify-center rounded-full border-2 border-[#C5A059] bg-[#4A3928] font-semibold text-white transition-all duration-300 ${isSidebarCollapsed ? "h-9 w-9 text-[10px]" : "mb-2 h-12 w-12 text-xs"}`}
          >
            {initials || "M"}
          </div>
          {!isSidebarCollapsed && (
            <div className="w-full px-2">
              <span className="mb-1 inline-block rounded-full bg-[#E8D9C2]/50 px-2 py-0.5 text-[9px] font-medium text-[#6F4C25]">
                Exclusive Member
              </span>
              <p className="truncate text-xs font-bold">{fullName}</p>
              <p className={`truncate text-[9px] ${mutedText}`}>{user?.email || "Email not provided"}</p>
            </div>
          )}
        </div>

        <nav
          aria-label="Member navigation"
          className="flex flex-1 flex-col gap-1.5 p-3"
        >
          {desktopNav.map((item) => {
            const Icon = item.icon;
            const active = item.id === "services";
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                title={isSidebarCollapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                className={`group flex items-center justify-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-200 active:scale-95 lg:justify-start ${
                  active
                    ? "bg-[#4A3928] text-white shadow-sm"
                    : "hover:bg-[#C5A059]/15 hover:text-[#4A3928]"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                {!isSidebarCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-inherit p-3">
          <button
            type="button"
            onClick={onLogout}
            title={isSidebarCollapsed ? "Log Out" : undefined}
            className="flex w-full items-center justify-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-red-600/80 transition-all hover:bg-red-500/10 active:scale-95 lg:justify-start"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isSidebarCollapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <header className="mb-6 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold">Services</h1>
              <p className={`mt-0.5 truncate text-[11px] ${mutedText}`}>
                Today is{" "}
                {today.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {isSearchOpen && (
                <input
                  type="search"
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search services..."
                  className={`w-36 rounded-full border px-3 py-1.5 text-xs outline-none focus:border-[#C5A059] sm:w-48 ${cardSurface}`}
                />
              )}

              <button
                type="button"
                onClick={() => setIsSearchOpen((prev) => !prev)}
                aria-label="Search"
                className={`rounded-full border p-2.5 ${cardSurface} hover:border-[#C5A059] transition-colors`}
              >
                <Search className="h-4 w-4" />
              </button>

              {/* Shopping Cart Button - Clicking this toggles the cart panel */}
              <button
                type="button"
                onClick={() => setIsCartOpen((prev) => !prev)}
                aria-label="Toggle Cart"
                className={`relative rounded-full border p-2.5 transition-all duration-200 active:scale-95 ${
                  isCartOpen
                    ? "bg-[#c2973e] text-white border-[#c2973e]"
                    : `${cardSurface} hover:border-[#C5A059]`
                }`}
              >
                <ShoppingBag className="h-4 w-4" />
                {cartService && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#c2973e] text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                    1
                  </span>
                )}
              </button>
            </div>
          </header>

          {/* Service Filter Tabs */}
          <div className="mb-5 flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
            {SERVICE_FILTERS.map((filter) => {
              const isActive = selectedFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setSelectedFilter(filter.id)}
                  aria-pressed={isActive}
                  className={`flex shrink-0 items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-[#c2973e] text-white shadow-xs"
                      : "border border-[#E5DEC9] bg-[#F5EFE1] text-[#63513B] hover:border-[#c2973e]"
                  }`}
                >
                  {filter.icon === "grid" && (
                    <span className="grid grid-cols-2 gap-0.5 w-2.5 h-2.5">
                      <span className="bg-current rounded-xs"></span>
                      <span className="bg-current rounded-xs"></span>
                      <span className="bg-current rounded-xs"></span>
                      <span className="bg-current rounded-xs"></span>
                    </span>
                  )}
                  {filter.label}
                </button>
              );
            })}
          </div>

          {/* Service Cards & Toggleable Cart Container */}
          <div className="relative flex gap-6 items-start">
            {/* Services Grid (Expands smoothly when cart is hidden) */}
            <section className="flex-1 min-w-0 transition-all duration-300">
              {filteredServices.length ? (
                <div
                  className={`grid gap-3 sm:gap-4 transition-all duration-300 ${
                    isCartOpen
                      ? "grid-cols-2 md:grid-cols-3"
                      : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                  }`}
                >
                  {filteredServices.map((service) => {
                    const details = BOOKING_SERVICE_DETAILS[service.id] || {
                      title: service.title,
                      price: service.price || 500,
                      duration: service.duration || "45 mins",
                    };
                    const isAdded = cartService?.id === service.id;

                    return (
                      <article
                        key={service.id}
                        className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-2.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${cardSurface}`}
                      >
                        <div>
                          <div className="relative overflow-hidden rounded-xl">
                            <img
                              src={service.image}
                              alt={details.title}
                              className="h-28 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-32"
                              loading="lazy"
                            />
                            {/* Orange '+' Add to Cart Button */}
                            <button
                              type="button"
                              onClick={() => handleAddToCart(service, details)}
                              className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-lg shadow-md transition-all duration-200 active:scale-90 ${
                                isAdded
                                  ? "bg-emerald-600 text-white"
                                  : "bg-[#c2973e] text-white hover:bg-[#a57d2f]"
                              }`}
                              title="Add to cart"
                            >
                              {isAdded ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : (
                                <span className="text-sm font-bold leading-none">
                                  +
                                </span>
                              )}
                            </button>
                          </div>

                          <div className="mt-2.5 px-0.5">
                            <h2 className="line-clamp-2 min-h-[32px] text-xs font-bold leading-snug">
                              {details.title}
                            </h2>
                            <p
                              className={`mt-1 line-clamp-2 text-[10px] leading-relaxed ${mutedText}`}
                            >
                              {service.description ||
                                "Professional salon care tailored for a premium finishing look."}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-baseline justify-between border-t border-inherit pt-2.5 px-0.5">
                          <span className="text-xs font-extrabold text-[#c2973e]">
                            {formatPrice(details.price)}
                          </span>
                          <span className={`text-[9px] ${mutedText}`}>
                            {details.duration}
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div
                  className={`rounded-2xl border p-10 text-center text-xs ${cardSurface} ${mutedText}`}
                >
                  {selectedFilter === "lashes"
                    ? "Eyelash services are currently coming soon."
                    : "No services match your selected filter."}
                </div>
              )}
            </section>

            {/* Current Cart Panel - ONLY MOUNTED & VISIBLE WHEN ISCARTOPEN IS TRUE */}
            {isCartOpen && (
              <aside
                className={`w-72 shrink-0 rounded-2xl border p-4 shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-right-4 ${
                  isDarkMode
                    ? "border-[#39342B] bg-[#211F1B]"
                    : "border-[#EEE7D8] bg-[#FFFBF0]"
                }`}
              >
                <div className="flex items-center justify-between border-b border-inherit pb-3">
                  <h2 className="text-xs font-bold">Current Cart</h2>
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(false)}
                    className="rounded-full p-1 hover:bg-black/5 text-[#8A8174] transition-colors"
                    aria-label="Close cart"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {cartService ? (
                  <div className="py-4">
                    <div className="flex gap-3 items-center">
                      <img
                        src={cartService.image}
                        alt=""
                        className="h-12 w-12 rounded-xl object-cover shadow-xs"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold">
                          {cartService.title}
                        </p>
                        <p className="mt-0.5 text-xs font-bold text-[#c2973e]">
                          {formatPrice(cartService.price)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCartService(null)}
                        className="text-[10px] text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </div>

                    <div
                      className={`mt-6 space-y-2 border-t pt-4 text-[11px] ${isDarkMode ? "border-[#39342B]" : "border-[#EAE1CE]"}`}
                    >
                      <div className="flex justify-between">
                        <span className={mutedText}>Subtotal</span>
                        <span>{formatPrice(cartService.price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={mutedText}>Discount</span>
                        <span>{formatPrice(0)}</span>
                      </div>
                      <div className="flex justify-between border-t border-inherit pt-2 font-bold text-xs">
                        <span>Total</span>
                        <span>{formatPrice(cartService.price)}</span>
                      </div>

                      <button
                        type="button"
                        onClick={openBooking}
                        className="mt-4 w-full rounded-full bg-[#c2973e] py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:bg-[#d47f17] active:scale-95"
                      >
                        Proceed to Booking
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <ShoppingBag
                      className={`mx-auto h-8 w-8 ${mutedText} opacity-40`}
                    />
                    <p className={`mt-2 text-xs ${mutedText}`}>
                      Your cart is currently empty.
                    </p>
                  </div>
                )}
              </aside>
            )}
          </div>
        </div>
      </main>

      {/* Floating Oval Bottom Nav Bar (Mobile Only) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-4 left-1/2 z-50 flex w-[90%] max-w-sm -translate-x-1/2 items-center justify-around rounded-full border border-white/10 bg-[#4A3928]/95 px-3 py-2 text-white shadow-xl backdrop-blur-md lg:hidden"
      >
        {desktopNav.map((item) => {
          const Icon = item.icon;
          const active = item.id === "services";
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.action}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center p-2 text-[10px] transition-all duration-200 ${
                active ? "font-bold text-[#F1E7C6]" : "text-white/70"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="mt-0.5 text-[9px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
