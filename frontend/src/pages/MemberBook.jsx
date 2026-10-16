import { useState } from "react";
import {
  Bell,
  CalendarDays,
  Clock,
  Home,
  LogOut,
  Moon,
  Plus,
  Scissors,
  Search,
  Sun,
  Trash2,
  UserRound,
} from "lucide-react";
import MemberBookScheduler from "./MemberBookScheduler.jsx";

export function LegacyMemberBookCheckout({
  user,
  isDarkMode,
  setIsDarkMode,
  setActivePage,
  onLogout,
  cartItems = [
    { id: 1, name: "Paracetamol 500mg", type: "1 strip", price: 50, quantity: 1 },
    { id: 2, name: "Combiflam", type: "1 strip", price: 60, quantity: 1 },
  ],
  onUpdateQuantity,
  onRemoveItem,
  onAddItem,
  onProceedToPayment,
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [addressType, setAddressType] = useState("home");
  const [scheduleDelivery, setScheduleDelivery] = useState(false);
  const [coupon, setCoupon] = useState("");

  const fullName = user?.fullName || user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Member";
  const initials = fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

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
  const inputBg = isDarkMode ? "bg-[#2A2723] border-[#39342B] text-[#F5F1EA]" : "bg-[#FDFBF7] border-[#E9E4D8] text-[#443523]";

  // Calculations
  const bagTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const convenienceFee = 5.00;
  const deliveryFee = 18.00;
  const platformFee = 2.00;
  const totalAmount = bagTotal + convenienceFee + deliveryFee + platformFee;

  return (
    <div className={`min-h-screen pb-24 lg:pb-0 lg:flex ${surface} transition-colors duration-300`}>
      {/* Sidebar matching other pages */}
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
          <span className={`transition-transform duration-300 ${isSidebarCollapsed ? "rotate-180" : ""}`}>
            ‹
          </span>
        </button>

        <div className="flex h-16 items-center justify-center px-4 border-b border-inherit">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Salon Logo"
              className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-[#C5A059]/20"
            />
            {!isSidebarCollapsed && (
              <div className="min-w-0 transition-opacity duration-300">
                <span className="text-xs font-bold leading-tight block truncate">Centy'zz</span>
                <span className="text-[10px] text-[#8A8174] block truncate">Hair & Beauty</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center border-b border-inherit py-4 px-2 text-center transition-all duration-300">
          <div
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

        <nav aria-label="Member navigation" className="flex flex-1 flex-col gap-1.5 p-3">
          {[
            { id: "home", label: "Home", icon: Home, action: () => setActivePage("home") },
            { id: "services", label: "Services", icon: Scissors, action: () => setActivePage("member-services") },
            { id: "booking", label: "Booking", icon: CalendarDays, action: () => setActivePage("member-bookings") },
            { id: "account", label: "Account", icon: UserRound, action: () => setActivePage("member-account") },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                className="group flex items-center justify-center lg:justify-start gap-3 rounded-xl px-3 py-2.5 text-xs font-medium hover:bg-[#C5A059]/15 hover:text-[#443523] transition-all duration-200 active:scale-95"
              >
                <Icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-inherit">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center justify-center lg:justify-start gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-red-600/80 hover:bg-red-500/15 transition-all duration-200 active:scale-95"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isSidebarCollapsed && <span className="truncate">Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Checkout Content */}
      <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <header className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActivePage("member-services")}
                className="text-lg font-bold hover:text-[#c2973e] transition-colors"
                aria-label="Back"
              >
                ‹
              </button>
              <h1 className="text-xl font-bold">Checkout</h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsDarkMode((current) => !current)}
                aria-label="Toggle dark mode"
                className={`rounded-full border p-2.5 ${cardSurface} hover:border-[#C5A059] transition-all`}
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button
                type="button"
                aria-label="Search"
                className={`rounded-full border p-2.5 ${cardSurface} hover:border-[#C5A059] transition-all`}
              >
                <Search className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Notifications"
                className={`rounded-full border p-2.5 ${cardSurface} hover:border-[#C5A059] transition-all`}
              >
                <Bell className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* Grid Container for Form & Cart Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
            
            {/* Left Column: Address & Delivery Form */}
            <section className={`rounded-2xl border p-6 shadow-sm ${cardSurface}`}>
              {/* Address Header & Type Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-inherit">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                    📍
                  </span>
                  <h2 className="text-sm font-bold">Address</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAddressType("home")}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      addressType === "home" ? "bg-black text-white dark:bg-white dark:text-black" : `${inputBg}`
                    }`}
                  >
                    Home
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddressType("work")}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      addressType === "work" ? "bg-black text-white dark:bg-white dark:text-black" : `${inputBg}`
                    }`}
                  >
                    Work
                  </button>
                  <button
                    type="button"
                    className={`flex h-8 w-8 items-center justify-center rounded-full border ${inputBg} hover:border-[#c2973e]`}
                    title="Add Address"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Form Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Name</label>
                  <input
                    type="text"
                    defaultValue={fullName}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none focus:border-[#c2973e] ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Mobile No.</label>
                  <input
                    type="text"
                    defaultValue="+63 912 345 6789"
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none focus:border-[#c2973e] ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Email</label>
                  <input
                    type="email"
                    defaultValue={user?.email || "user@example.com"}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none focus:border-[#c2973e] ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">City</label>
                  <input
                    type="text"
                    defaultValue="Quezon City"
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none focus:border-[#c2973e] ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">State</label>
                  <input
                    type="text"
                    defaultValue="Metro Manila"
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none focus:border-[#c2973e] ${inputBg}`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Pin code</label>
                    <input
                      type="text"
                      defaultValue="1100"
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none focus:border-[#c2973e] ${inputBg}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Locality</label>
                    <input
                      type="text"
                      defaultValue="Diliman"
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none focus:border-[#c2973e] ${inputBg}`}
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Address</label>
                  <input
                    type="text"
                    defaultValue="123 Commonwealth Avenue, Diliman, Quezon City, 1100."
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none focus:border-[#c2973e] ${inputBg}`}
                  />
                </div>
              </div>

              {/* Schedule Delivery Toggle Section */}
              <div className="mt-8 pt-6 border-t border-inherit">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#8A8174]" />
                    <span className="text-xs font-bold">Schedule delivery</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setScheduleDelivery((prev) => !prev)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      scheduleDelivery ? "bg-[#c2973e]" : "bg-gray-300 dark:bg-neutral-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        scheduleDelivery ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {scheduleDelivery && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Date</label>
                      <input
                        type="text"
                        defaultValue="12 November, 2026"
                        className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none focus:border-[#c2973e] ${inputBg}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Time</label>
                      <input
                        type="text"
                        defaultValue="12:00 PM - 3:00 AM"
                        className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none focus:border-[#c2973e] ${inputBg}`}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Note</label>
                  <input
                    type="text"
                    placeholder="Please be on time"
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none focus:border-[#c2973e] ${inputBg}`}
                  />
                </div>
              </div>
            </section>

            {/* Right Column: Order Summary & Items in Cart */}
            <div className="space-y-6">
              <section className={`rounded-2xl border p-5 shadow-sm ${cardSurface}`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-extrabold">₱{totalAmount.toFixed(2)}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8174]">Total</span>
                </div>

                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-inherit">
                  <span className="text-xs">🛒</span>
                  <h3 className="text-xs font-bold">Items in the cart</h3>
                </div>

                {/* Cart Items List */}
                <div className="space-y-2.5 mb-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between rounded-xl p-2.5 ${
                        isDarkMode ? "bg-[#2A2723]" : "bg-[#F3EFE7]"
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-bold truncate">{item.name}</p>
                        <p className={`text-[10px] ${mutedText}`}>({item.type})</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1.5 bg-background/50 rounded-lg px-2 py-1 text-xs border border-inherit">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity && onUpdateQuantity(item.id, item.quantity - 1)}
                            className="hover:text-[#c2973e]"
                          >
                            -
                          </button>
                          <span className="font-bold">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity && onUpdateQuantity(item.id, item.quantity + 1)}
                            className="hover:text-[#c2973e]"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveItem && onRemoveItem(item.id)}
                          className="text-red-500 hover:opacity-80 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={onAddItem}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#c2973e] hover:underline mb-6"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Item
                </button>

                <div className="space-y-2.5 border-t border-inherit pt-4 text-xs">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-2">Order Details</h4>
                  <div className="flex justify-between">
                    <span className={mutedText}>Bag Total</span>
                    <span>₱{bagTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={mutedText}>Convenience Fee</span>
                    <span>₱{convenienceFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={mutedText}>Delivery Fee</span>
                    <span>₱{deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={mutedText}>Platform Fee</span>
                    <span>₱{platformFee.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-inherit mt-4 pt-4 text-sm font-extrabold">
                  <span>Amount Payable</span>
                  <span>₱{totalAmount.toFixed(2)}</span>
                </div>

                {/* Savings Banner */}
                <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                  <span>Your total savings on this order</span>
                  <span>₱15.00</span>
                </div>

                {/* Coupon Code Input */}
                <div className="mt-4 flex gap-2">
                  <input
                    type="text"
                    placeholder="Coupon code"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    className={`flex-1 rounded-xl border px-3 py-2 text-xs outline-none focus:border-[#c2973e] ${inputBg}`}
                  />
                  <button
                    type="button"
                    className="rounded-xl bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-xs font-bold hover:opacity-90 active:scale-95 transition-all"
                  >
                    Apply
                  </button>
                </div>
              </section>

              {/* Proceed Button */}
              <button
                type="button"
                onClick={onProceedToPayment}
                className="w-full rounded-2xl bg-[#171512] dark:bg-white dark:text-[#171512] text-white py-4 text-xs font-bold tracking-wide shadow-lg hover:opacity-95 active:scale-95 transition-all"
              >
                Proceed to Payment
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default function MemberBook(props) {
  return <MemberBookScheduler {...props} />;
}