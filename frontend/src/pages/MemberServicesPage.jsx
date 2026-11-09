import { useEffect, useState } from "react";
import MemberSidebar from "../components/MemberSidebar";
import { getServiceImage } from "../utils/serviceImages";
import {
  Check,
  Eye,
  Hand,
  Scissors,
  Search,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react";
import { api } from "../api/client";
import MemberCheckoutModal from "../components/MemberCheckoutModal";

const getServiceIcon = (service) => {
  const searchable = `${service.category || ""} ${service.title || ""}`.toLowerCase();
  if (/lash|brow|eye/.test(searchable)) return Eye;
  if (/nail|mani|pedi/.test(searchable)) return Hand;
  if (/skin|facial|wax|makeup|beauty/.test(searchable)) return Sparkles;
  return Scissors;
};

const formatPrice = (price) => `₱${Number(price).toLocaleString("en-PH")}`;

export default function MemberServicesPage({
  user,
  isDarkMode,
  setActivePage,
  onLogout,
}) {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [serviceGroups, setServiceGroups] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState("");
  const [cartServices, setCartServices] = useState([]);

  // Cart panel / modal state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const cardSurface = isDarkMode
    ? "border-[#39342B] bg-[#211F1B]"
    : "border-[#E9E4D8] bg-white";
  const mutedText = isDarkMode ? "text-[#C9C1B5]" : "text-[#8A8174]";
  const today = new Date();

  useEffect(() => {
    let current = true;
    api.getServices().then((result) => { if (current) setServiceGroups(Array.isArray(result) ? result : result.data || []); })
      .catch((error) => { if (current) setServicesError(error.message); })
      .finally(() => { if (current) setServicesLoading(false); });
    return () => { current = false; };
  }, []);

  useEffect(() => {
    if (!isCartOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsCartOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCartOpen]);

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
    const isAlreadyInCart = cartServices.some((item) => String(item.id) === String(service.id));
    if (isAlreadyInCart) {
      setCartServices((items) => items.filter((item) => String(item.id) !== String(service.id)));
    } else {
      setCartServices((items) => [...items, { ...service, ...details }]);
      setIsCartOpen(true);
    }
  };

  const openBooking = () => {
    if (cartServices.length) {
      setIsCartOpen(false);
      setIsCheckoutOpen(true);
    }
  };

  const renderCartItemsList = () => (
    <ul className="max-h-64 space-y-3 overflow-y-auto pr-1">
      {cartServices.map((item) => {
        const ItemIcon = getServiceIcon(item);
        return (
          <li key={item.id} className="flex items-center gap-3">
            <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${isDarkMode ? "bg-[#30291E]" : "bg-[#F6F0E6]"}`}>
              <ItemIcon className="h-5 w-5 text-[#C5A059]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold">{item.title}</p>
              <p className="mt-0.5 text-xs font-bold text-[#B48B43]">{formatPrice(item.price)}</p>
            </div>
            <button
              type="button"
              onClick={() => setCartServices((items) => items.filter((service) => String(service.id) !== String(item.id)))}
              className="min-h-11 px-2 text-[10px] text-red-500 hover:underline"
              aria-label={`Remove ${item.title}`}
            >
              Remove
            </button>
          </li>
        );
      })}
    </ul>
  );

  const renderCartSummary = () => (
    <div className={`mt-6 space-y-2 border-t pt-4 text-[11px] ${isDarkMode ? "border-[#39342B]" : "border-[#EAE1CE]"}`}>
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
  );

  return (
    <div
      className={`min-h-screen pb-24 transition-colors duration-300 lg:flex lg:pb-0 ${isDarkMode ? "bg-[#171512] text-[#F5F1EA]" : "bg-[#F6F4EF] text-[#443523]"}`}
    >
      {/* Sidebar matching other sides */}
      <MemberSidebar
        user={user}
        activePage="member-services"
        setActivePage={setActivePage}
        onLogout={onLogout}
        isDarkMode={isDarkMode}
      />

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

              {/* Shopping Cart Button */}
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
                    const details = {
                      title: service.title,
                      price: service.price,
                      duration: service.durationMinutes ? `${service.durationMinutes} mins` : "Duration not provided",
                    };
                    const isAdded = cartServices.some((item) => String(item.id) === String(service.id));

                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => handleAddToCart(service, details)}
                        aria-pressed={isAdded}
                        aria-label={`${isAdded ? "Remove" : "Add"} ${details.title} ${isAdded ? "from" : "to"} cart`}
                        className={`group relative flex min-w-0 items-center gap-3 overflow-hidden rounded-2xl border p-3 text-left transition-all duration-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059] sm:flex-col sm:items-stretch sm:justify-between sm:p-2.5 sm:hover:-translate-y-1 ${cardSurface} ${isAdded ? "border-[#C5A059] ring-2 ring-[#C5A059]/30" : ""}`}
                      >
                        <img src={serviceImage} alt="" loading="lazy" className="h-20 w-20 shrink-0 rounded-xl object-cover sm:h-32 sm:w-full" />

                        {isAdded && <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#4A3928] text-white shadow sm:right-3 sm:top-3"><Check className="h-4 w-4" /></span>}

                        <div className="flex min-w-0 flex-1 flex-col self-stretch sm:flex-1">
                          <h2 className="line-clamp-2 pr-12 text-sm font-bold leading-snug sm:min-h-[32px] sm:pr-0 sm:text-xs">
                            {details.title}
                          </h2>
                          <p className={`mt-1 line-clamp-2 text-xs leading-relaxed sm:text-[10px] ${mutedText}`}>
                            {service.description || "Professional salon care tailored for a premium finishing look."}
                          </p>
                        </div>

                        <div className="mt-3 flex items-baseline justify-between border-t border-inherit pt-2.5 px-0.5">
                          <span className="text-xs font-extrabold text-[#B48B43]">
                            {formatPrice(details.price)}
                          </span>
                          <span className={`text-[9px] ${mutedText}`}>
                            {details.duration}
                          </span>
                        </div>
                      </button>
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

            {/* Desktop Cart: inline panel beside services grid */}
            {isCartOpen && (
              <aside
                id="member-services-cart"
                aria-label="Current Cart"
                className={`hidden lg:flex lg:relative lg:h-auto lg:w-72 lg:flex-none lg:flex-col lg:rounded-2xl lg:border lg:p-4 lg:shadow-xl ${
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
                    {renderCartItemsList()}
                    {renderCartSummary()}
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

      {/* Mobile Cart Modal: renders as a centered dialog instead of a full-screen drawer */}
      {isCartOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 lg:hidden"
          role="presentation"
        >
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setIsCartOpen(false)}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-cart-title"
            className={`relative z-10 flex max-h-[85vh] w-full max-w-sm sm:max-w-md flex-col rounded-2xl border p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 ${
              isDarkMode
                ? "border-[#39342B] bg-[#211F1B] text-[#F5F1EA]"
                : "border-[#E9E4D8] bg-[#FFFDF8] text-[#443523]"
            }`}
          >
            <div className="flex items-center justify-between border-b border-inherit pb-3">
              <div className="flex items-center gap-2">
                <h2 id="mobile-cart-title" className="text-sm font-bold">Current Cart</h2>
                {cartServices.length > 0 && (
                  <span className="rounded-full bg-[#C5A059] px-2 py-0.5 text-[10px] font-bold text-white">
                    {cartServices.length} {cartServices.length === 1 ? "item" : "items"}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className={`rounded-full p-1.5 transition-colors ${
                  isDarkMode ? "text-[#C9C1B5] hover:bg-white/10" : "text-[#8A8174] hover:bg-black/5"
                }`}
                aria-label="Close cart modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {cartServices.length ? (
              <div className="py-4 overflow-y-auto">
                {renderCartItemsList()}
                {renderCartSummary()}
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
          </div>
        </div>
      )}

      {isCheckoutOpen && <MemberCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        services={cartServices}
        user={user}
        isDarkMode={isDarkMode}
        onComplete={() => {
          setCartServices([]);
          setIsCheckoutOpen(false);
          setActivePage("member-bookings");
        }}
      />}
    </div>
  );
}
