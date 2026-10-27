import { useEffect, useState } from "react";
import useMemberSidebarState from "../hooks/useMemberSidebarState";
import { getServiceImage } from "../utils/serviceImages";
import {
  CalendarDays,
  Check,
  Eye,
  Hand,
  Home,
  LogOut,
  Scissors,
  Search,
  ShoppingBag,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { api } from "../api/client";

const formatPrice = (price) => `₱${Number(price).toLocaleString("en-PH")}`;

const getServiceIcon = (service) => {
  const searchable = `${service.category || ""} ${service.title || ""}`.toLowerCase();
  if (/lash|brow|eye/.test(searchable)) return Eye;
  if (/nail|mani|pedi/.test(searchable)) return Hand;
  if (/skin|facial|wax|makeup|beauty/.test(searchable)) return Sparkles;
  return Scissors;
};

export default function MemberServicesPage({
  user,
  isDarkMode,
  setActivePage,
  onOpenBooking,
  onLogout,
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useMemberSidebarState();
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [serviceGroups, setServiceGroups] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState("");
  const [cartServices, setCartServices] = useState([]);

  // Cart panel is hidden by default (false)
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const fullName = user?.fullName || user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Member";
  const initials = fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const profilePhoto = (() => { try { return localStorage.getItem(`centyzz-member-avatar:${user?.id ?? user?.email ?? "member"}`) || ""; } catch { return ""; } })();

  const cardSurface = isDarkMode
    ? "border-[#39342B] bg-[#211F1B]"
    : "border-[#E9E4D8] bg-white";
  const mutedText = isDarkMode ? "text-[#C9C1B5]" : "text-[#8A8174]";
  const sidebarSurface = isDarkMode
    ? "border-[#39342B] bg-[#1D1A16]"
    : "border-[#E9E4D8] bg-[#FFFDF8]";
  const today = new Date();

  useEffect(() => {
    let current = true;
    api.getServices().then((result) => { if (current) setServiceGroups(Array.isArray(result) ? result : result.data || []); })
      .catch((error) => { if (current) setServicesError(error.message); })
      .finally(() => { if (current) setServicesLoading(false); });
    return () => { current = false; };
  }, []);

  const serviceList = serviceGroups.flatMap((group) => (group.services || []).map((service) => ({ ...service, title: service.name, category: group.category })));
  const serviceFilters = [{ id: "all", label: "All services" }, ...serviceGroups.map((group) => ({ id: group.category, label: group.category }))];
  const filteredServices = serviceList.filter((service) => {
    const matchesFilter = selectedFilter === "all" || service.category === selectedFilter;
    const query = search.trim().toLowerCase();
    const matchesSearch =
      service.title.toLowerCase().includes(query) ||
      String(service.description || "").toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  const handleAddToCart = (service, details) => {
    setCartServices((items) => items.some((item) => String(item.id) === String(service.id))
      ? items.filter((item) => String(item.id) !== String(service.id))
      : [...items, { ...service, ...details }]);
    setIsCartOpen(true);
  };

  const openBooking = () => {
    if (cartServices.length) onOpenBooking(cartServices);
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
      className={`min-h-screen pb-24 transition-colors duration-300 lg:flex lg:pb-0 ${isDarkMode ? "bg-[#171512] text-[#F5F1EA]" : "bg-[#F6F4EF] text-[#443523]"}`}
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
          className={`absolute -right-3 top-6 z-20 flex h-6 w-6 items-center justify-center rounded-full border text-xs shadow-md transition-transform hover:scale-110 active:scale-95 ${isDarkMode ? "border-[#51493B] bg-[#29251E] text-[#F1E7C6]" : "border-[#E9E4D8] bg-white text-[#443523]"}`}
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
                <span className={`block truncate text-[10px] ${mutedText}`}>
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
            {profilePhoto ? <img src={profilePhoto} alt="" className="h-full w-full rounded-full object-cover" /> : (initials || "M")}
          </div>
          {!isSidebarCollapsed && (
            <div className="w-full px-2">
              <span className={`mb-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-medium ${isDarkMode ? "bg-[#3A3023] text-[#D9B66C]" : "bg-[#E8D9C2]/50 text-[#6F4C25]"}`}>
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
                    : isDarkMode ? "text-[#C9C1B5] hover:bg-[#C5A059]/15 hover:text-[#F1E7C6]" : "text-[#63513B] hover:bg-[#C5A059]/15 hover:text-[#4A3928]"
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
      <main className="min-w-0 flex-1 px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <header className="mb-4 flex items-center justify-between gap-3 sm:mb-6 sm:gap-4">
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
                  className={`w-36 rounded-full border px-3 py-1.5 text-xs outline-none focus:border-[#C5A059] sm:w-48 ${cardSurface} ${isDarkMode ? "text-[#F5F1EA] placeholder:text-[#8A8174]" : "text-[#443523] placeholder:text-[#8A8174]"}`}
                />
              )}

              <button
                type="button"
                onClick={() => setIsSearchOpen((prev) => !prev)}
                aria-label="Search"
                className={`grid min-h-11 min-w-11 place-items-center rounded-full border ${cardSurface} transition-colors hover:border-[#C5A059]`}
              >
                <Search className="h-4 w-4" />
              </button>

              {/* Shopping Cart Button - Clicking this toggles the cart panel */}
              <button
                type="button"
                onClick={() => setIsCartOpen((prev) => !prev)}
                aria-label="Toggle Cart"
                aria-expanded={isCartOpen}
                aria-controls="member-services-cart"
                className={`relative grid min-h-11 min-w-11 place-items-center rounded-full border transition-all duration-200 active:scale-95 ${
                  isCartOpen
                    ? "bg-[#C5A059] text-white border-[#C5A059]"
                    : `${cardSurface} hover:border-[#C5A059]`
                }`}
              >
                <ShoppingBag className="h-4 w-4" />
                {cartServices.length > 0 && (
                  <span className={`absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#C5A059] text-[9px] font-bold text-white shadow-sm ring-2 ${isDarkMode ? "ring-[#171512]" : "ring-white"}`}>
                    {cartServices.length}
                  </span>
                )}
              </button>
            </div>
          </header>

          {/* Service Filter Tabs */}
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1.5 scrollbar-none sm:mb-5">
            {serviceFilters.map((filter) => {
              const isActive = selectedFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setSelectedFilter(filter.id)}
                  aria-pressed={isActive}
                  className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
                    isActive
                    ? "bg-[#C5A059] text-white shadow-xs"
                      : isDarkMode
                        ? "border border-[#51493B] bg-[#211F1B] text-[#D6D0C8] hover:border-[#C5A059]"
                        : "border border-[#E9E4D8] bg-[#FFFDF8] text-[#63513B] hover:border-[#C5A059]"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          {/* Service Cards & Toggleable Cart Container */}
          <div className="relative flex flex-col items-start gap-6 lg:flex-row">
            {/* Services Grid (Expands smoothly when cart is hidden) */}
            <section className="flex-1 min-w-0 transition-all duration-300">
              {servicesLoading && <p role="status" className="mb-3 text-sm">Loading services…</p>}
              {servicesError && <p role="alert" className="mb-3 text-sm text-red-600">Couldn’t load services: {servicesError}</p>}
              {filteredServices.length ? (
                <div
                  className={`grid grid-cols-1 gap-3 transition-all duration-300 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 ${isCartOpen ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}
                >
                  {filteredServices.map((service) => {
                    const serviceImage = getServiceImage(service.title, service.category);
                    const ServiceIcon = getServiceIcon(service);
                    const details = {
                      title: service.title,
                      price: service.price,
                      duration: service.durationMinutes ? `${service.durationMinutes} mins` : "Duration not provided",
                    };
                    const isAdded = cartServices.some((item) => String(item.id) === String(service.id));

                    return (
                      <article
                        key={service.id}
                        className={`group relative flex min-w-0 items-center gap-3 overflow-hidden rounded-2xl border p-3 transition-all duration-300 hover:shadow-md sm:flex-col sm:items-stretch sm:justify-between sm:p-2.5 sm:hover:-translate-y-1 ${cardSurface}`}
                      >
                        <img src={serviceImage} alt={details.title} loading="lazy" className="h-20 w-20 shrink-0 rounded-xl object-cover sm:h-32 sm:w-full" />

                        <div className="flex min-w-0 flex-1 flex-col self-stretch sm:flex-1">
                          <h2 className="line-clamp-2 pr-12 text-sm font-bold leading-snug sm:min-h-[32px] sm:pr-0 sm:text-xs">
                            {details.title}
                          </h2>
                          <p className={`mt-1 line-clamp-2 text-xs leading-relaxed sm:text-[10px] ${mutedText}`}>
                            {service.description || "Professional salon care tailored for a premium finishing look."}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddToCart(service, details)}
                          className={`absolute right-3 top-3 flex min-h-11 min-w-11 items-center justify-center rounded-lg shadow-md transition-all duration-200 active:scale-90 sm:right-2 sm:top-2 ${
                            isAdded
                              ? "bg-[#4A3928] text-white"
                              : "bg-[#C5A059] text-white hover:bg-[#A9823F]"
                          }`}
                          title={isAdded ? "Remove from cart" : "Add to cart"}
                          aria-label={`${isAdded ? "Remove" : "Add"} ${details.title} ${isAdded ? "from" : "to"} cart`}
                        >
                          {isAdded ? <Check className="h-3.5 w-3.5" /> : <span className="text-sm font-bold leading-none">+</span>}
                        </button>
                        <div className="mt-3 flex items-baseline justify-between border-t border-inherit pt-2.5 px-0.5">
                          <span className="text-xs font-extrabold text-[#B48B43]">
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

            {/* Current Cart: inline on desktop, overlay drawer on mobile */}
            {isCartOpen && (
              <div className="fixed inset-0 z-[60] lg:contents">
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="absolute inset-0 bg-black/40 backdrop-blur-[1px] lg:hidden"
                  aria-label="Close current cart"
                />
                <aside
                  id="member-services-cart"
                  aria-label="Current Cart"
                  className={`absolute inset-y-0 right-0 z-[61] flex h-full w-full max-w-md flex-col overflow-y-auto border-l p-5 shadow-2xl animate-in fade-in slide-in-from-right duration-200 lg:relative lg:inset-auto lg:z-auto lg:h-auto lg:w-72 lg:max-w-none lg:flex-none lg:rounded-2xl lg:border lg:p-4 lg:shadow-xl lg:animate-none ${
                    isDarkMode
                      ? "border-[#39342B] bg-[#211F1B]"
                      : "border-[#E9E4D8] bg-[#FFFDF8]"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-inherit pb-3">
                  <h2 className="text-xs font-bold">Current Cart</h2>
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(false)}
                    className={`rounded-full p-1 transition-colors ${isDarkMode ? "text-[#C9C1B5] hover:bg-white/10" : "text-[#8A8174] hover:bg-black/5"}`}
                    aria-label="Close cart"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {cartServices.length ? (
                  <div className="py-4">
                    <ul className="max-h-64 space-y-3 overflow-y-auto">
                      {cartServices.map((item) => {
                        const ItemIcon = getServiceIcon(item);
                        return <li key={item.id} className="flex items-center gap-3">
                          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${isDarkMode ? "bg-[#30291E]" : "bg-[#F6F0E6]"}`}><ItemIcon className="h-5 w-5 text-[#C5A059]" /></div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold">{item.title}</p>
                            <p className="mt-0.5 text-xs font-bold text-[#B48B43]">{formatPrice(item.price)}</p>
                          </div>
                          <button type="button" onClick={() => setCartServices((items) => items.filter((service) => String(service.id) !== String(item.id)))} className="min-h-11 px-2 text-[10px] text-red-500 hover:underline" aria-label={`Remove ${item.title}`}>Remove</button>
                        </li>;
                      })}
                    </ul>

                    <div
                      className={`mt-6 space-y-2 border-t pt-4 text-[11px] ${isDarkMode ? "border-[#39342B]" : "border-[#EAE1CE]"}`}
                    >
                      <div className="flex justify-between">
                        <span className={mutedText}>Subtotal</span>
                        <span>{formatPrice(cartServices.reduce((sum, item) => sum + Number(item.price || 0), 0))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={mutedText}>Discount</span>
                        <span>{formatPrice(0)}</span>
                      </div>
                      <div className="flex justify-between border-t border-inherit pt-2 font-bold text-xs">
                        <span>Total</span>
                        <span>{formatPrice(cartServices.reduce((sum, item) => sum + Number(item.price || 0), 0))}</span>
                      </div>

                      <button
                        type="button"
                        onClick={openBooking}
                        className="mt-4 min-h-11 w-full rounded-full bg-[#C5A059] py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:bg-[#A9823F] active:scale-95"
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
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Oval Bottom Nav Bar (Mobile Only) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-3 left-1/2 z-50 flex w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 items-center justify-around rounded-full border border-white/10 bg-[#4A3928]/95 px-2 py-1.5 text-white shadow-xl backdrop-blur-md lg:hidden"
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
              className={`flex min-h-11 min-w-[3.5rem] flex-col items-center justify-center rounded-full px-1 text-[10px] transition-all duration-200 ${
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
