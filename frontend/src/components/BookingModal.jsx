import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Sparkles, 
  Clock, 
  User, 
  CreditCard,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

// Always use the salon's local calendar date, regardless of the visitor's time zone.
function getSalonToday() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function formatClock(time) {
  const [hours, minutes] = String(time).split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return String(time);
  return `${String(hours % 12 || 12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
}

function toDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const guestSessionKey = 'centyzz-guest-checkout';
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[0-9+\-\s()]{7,15}$/;

const getEmailError = (value) =>
  emailPattern.test(value.trim()) ? '' : 'Please enter a valid email address.';
const getPhoneError = (value) =>
  phonePattern.test(value.trim()) ? '' : 'Please enter a valid contact number.';

function BookingModal({ isOpen, onClose, selectedService, isDarkMode }) {
  const [step, setStep] = useState('form');
  const [serviceGroups, setServiceGroups] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [servicesError, setServicesError] = useState('');
  const [category, setCategory] = useState(''); // Database category id, not a display label
  const [serviceId, setServiceId] = useState(''); // Exactly one service for a guest
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [checkingSlot, setCheckingSlot] = useState(false);
  const [formError, setFormError] = useState('');
  const [stylists, setStylists] = useState([]);
  const [stylistId, setStylistId] = useState('');
  const [loadingStylists, setLoadingStylists] = useState(false);
  const [checkout, setCheckout] = useState(null);
  const [checkoutStatus, setCheckoutStatus] = useState(null);
  const [submittingCheckout, setSubmittingCheckout] = useState(false);

  const initialSalonDate = getSalonToday();
  const [yearToday, monthToday, dayToday] = initialSalonDate.split('-').map(Number);
  const [currentDate, setCurrentDate] = useState(() => new Date(yearToday, monthToday - 1, 1));
  const [selectedDay, setSelectedDay] = useState(dayToday);
  const [selectedTime, setSelectedTime] = useState(''); // Backend HH:mm value

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const chosenStylist = stylists.find((s) => String(s.id) === stylistId);
  const stylist = chosenStylist?.name || 'Choose a specialist';

  const allServices = useMemo(
    () => serviceGroups.flatMap((group) => group.services || []),
    [serviceGroups],
  );
  const categoryServices = serviceGroups.find((group) => String(group.id) === category)?.services || [];
  const currentServiceObj = allServices.find((service) => String(service.id) === serviceId);
  const serviceTitle = currentServiceObj?.name || '';
  const totalPriceNumber = Number(currentServiceObj?.price || 0);
  const depositAmount = totalPriceNumber * 0.5;
  const balanceRemaining = totalPriceNumber - depositAmount;
  const selectedDate = toDateKey(currentDate.getFullYear(), currentDate.getMonth(), selectedDay);
  const selectedSlot = slots.find((slot) => slot.startTime === selectedTime && slot.available);

  // Home and Services both open this same component. A Services-page click supplies
  // its real database id; Home defaults to the first available database service.
  useEffect(() => {
    if (!isOpen) return undefined;
    let active = true;
    // PayMongo return redirects recreate the modal and restore a local checkout reference.
    const returningFromCheckout = new URLSearchParams(window.location.search).has('centyzz_booking');
    const stored = (() => { try { return JSON.parse(sessionStorage.getItem(guestSessionKey) || 'null'); } catch { return null; } })();
    if (returningFromCheckout && stored?.referenceCode && stored?.token) {
      setCheckout(stored);
      setStep('result');
      api.getGuestCheckoutStatus(stored.referenceCode, stored.token)
        .then((status) => { if (active) setCheckoutStatus(status); })
        .catch((err) => { if (active) setFormError(err.message); });
      const url = new URL(window.location.href);
      url.searchParams.delete('centyzz_booking');
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    } else {
      setStep('form');
      setCheckout(null);
      setCheckoutStatus(null);
    }
    setFormError('');
    setStylistId('');
    setStylists([]);
    setLoadingStylists(true);
    api.getGuestStylists().then((data) => {
      if (active) setStylists(Array.isArray(data) ? data : data?.data || []);
    }).catch((err) => { if (active) setFormError('Could not load specialists: ' + err.message); })
      .finally(() => { if (active) setLoadingStylists(false); });
    setSlots([]);
    setSelectedTime('');
    setServicesError('');
    setLoadingServices(true);
    const salonDate = getSalonToday().split('-').map(Number);
    setCurrentDate(new Date(salonDate[0], salonDate[1] - 1, 1));
    setSelectedDay(salonDate[2]);

    api.getServices()
      .then((result) => {
        if (!active) return;
        const groups = Array.isArray(result) ? result : result?.data || [];
        setServiceGroups(groups);
        const available = groups.flatMap((group) =>
          (group.services || []).map((service) => ({ ...service, categoryId: String(group.id) }))
        );
        const requestedName = String(selectedService?.name || selectedService?.title || '').trim().toLowerCase();
        const matched = available.find((service) =>
          selectedService?.id != null && String(service.id) === String(selectedService.id)
        ) || available.find((service) =>
          requestedName && service.name.toLowerCase() === requestedName
        ) || available[0];
        setCategory(matched?.categoryId || '');
        setServiceId(matched ? String(matched.id) : '');
      })
      .catch((error) => {
        if (active) { setServicesError(error.message); setServiceGroups([]); setServiceId(''); }
      })
      .finally(() => { if (active) setLoadingServices(false); });
    return () => { active = false; };
  }, [isOpen, selectedService]);

  // Refetch when the date or selected service changes. Ignore responses from
  // superseded requests so stale slots cannot become selectable.
  useEffect(() => {
    if (!isOpen || !serviceId || !stylistId) { setSlots([]); setSelectedTime(''); return undefined; }
    let active = true;
    setSlots([]);
    setSelectedTime('');
    setSlotsError('');
    setFormError('');
    setLoadingSlots(true);
    api.getGuestAvailableSlots(selectedDate, Number(serviceId), stylistId)
      .then((result) => {
        if (active) setSlots(Array.isArray(result.slots) ? result.slots : []);
      })
      .catch((error) => {
        if (active) { setSlots([]); setSlotsError(error.message); }
      })
      .finally(() => { if (active) setLoadingSlots(false); });
    return () => { active = false; };
  }, [isOpen, serviceId, stylistId, selectedDate]);

  const handleCategoryChange = (event) => {
    const next = event.target.value;
    setCategory(next);
    const first = serviceGroups.find((group) => String(group.id) === next)?.services?.[0];
    setServiceId(first ? String(first.id) : '');
    setSelectedTime('');
  };

  const modalSurface = isDarkMode ? 'bg-[#1A1917] border-[#3A342B]' : 'bg-[#FDFBF7] border-[#E8DFD1]';
  const primaryText = isDarkMode ? 'text-[#F5F1EA]' : 'text-[#2A1E1B]';
  const mutedText = isDarkMode ? 'text-[#C9C1B5]' : 'text-gray-600';
  const fieldStyle = isDarkMode
    ? 'border-[#3A342B] bg-[#242220] text-[#F5F1EA] placeholder-[#A9A39B]'
    : 'border-[#E8DFD1] bg-white text-[#2A1E1B]';
  const insetSurface = isDarkMode ? 'bg-[#242220] border-[#3A342B]' : 'bg-[#F6F0E6] border-[#E8DFD1]';
  const primaryButton = isDarkMode
    ? 'bg-[#3A342B] border border-[#8D7444] text-[#F5F1EA] hover:bg-[#51432D] hover:border-[#C5A059]'
    : 'bg-[#2A1E1B] text-white hover:bg-[#C5A059]';

  if (!isOpen) return null;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = currentDate.getFullYear();
  const currentMonthIndex = currentDate.getMonth();
  const monthName = monthNames[currentMonthIndex];
  const todayDateKey = getSalonToday();
  const [todayYear, todayMonth] = todayDateKey.split('-').map(Number);
  const isCurrentMonth = currentYear === todayYear && currentMonthIndex === todayMonth - 1;

  const prevMonth = () => {
    if (isCurrentMonth) return;
    const previous = new Date(currentYear, currentMonthIndex - 1, 1);
    if (toDateKey(previous.getFullYear(), previous.getMonth(), 1).slice(0, 7) < todayDateKey.slice(0, 7)) return;
    setCurrentDate(previous);
    setSelectedDay(1);
    setSelectedTime('');
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonthIndex + 1, 1));
    setSelectedDay(1);
    setSelectedTime('');
  };

  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonthIndex, 1).getDay();
  const prevMonthDays = new Date(currentYear, currentMonthIndex, 0).getDate();
  const paddingDays = Array.from({ length: firstDayOfWeek }, (_, i) => prevMonthDays - firstDayOfWeek + i + 1);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const isPastDay = (day) => toDateKey(currentYear, currentMonthIndex, day) < todayDateKey;

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    const nextPhoneError = getPhoneError(phone);
    const nextEmailError = getEmailError(email);
    setPhoneError(nextPhoneError);
    setEmailError(nextEmailError);
    if (nextPhoneError || nextEmailError) return;
    if (!currentServiceObj || loadingServices || loadingStylists || loadingSlots || slotsError) {
      setFormError('Please choose a service and wait for availability to load.');
      return;
    }
    if (!stylistId || !chosenStylist) {
      setFormError('Choose an active specialist to see their available appointments.');
      return;
    }
    if (!selectedSlot) {
      setFormError('Please select an available appointment time.');
      return;
    }
    // Recheck immediately before entering the summary, because another visitor
    // may have booked this slot since the calendar originally loaded.
    setCheckingSlot(true);
    try {
      const fresh = await api.getGuestAvailableSlots(selectedDate, Number(serviceId), stylistId);
      const latestSlots = Array.isArray(fresh.slots) ? fresh.slots : [];
      setSlots(latestSlots);
      if (!latestSlots.some((slot) => slot.startTime === selectedTime && slot.available)) {
        setSelectedTime('');
        setFormError('That time is no longer available. Please select another one.');
        return;
      }
      setStep('confirm');
    } catch (error) {
      setFormError(`Could not verify the selected time: ${error.message}`);
    } finally {
      setCheckingSlot(false);
    }
  };

  const beginCheckout = async () => {
    if (!chosenStylist || !currentServiceObj) { setFormError('Choose a service and specialist.'); setStep('form'); return; }
    setSubmittingCheckout(true);
    setFormError('');
    try {
      const created = await api.createGuestCheckout({
        serviceId: Number(serviceId),
        stylistId: stylistId,
        appointmentDate: selectedDate,
        startTime: selectedTime,
        customerName: fullName.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
      });
      setCheckout(created);
      if (created.mode === 'PAYMONGO_TEST' && created.checkoutUrl) {
        sessionStorage.setItem(guestSessionKey, JSON.stringify({referenceCode: created.referenceCode, token: created.token}));
        window.location.assign(created.checkoutUrl);
      } else if (created.mode === 'DEMO') {
        setStep('demo');
      } else {
        throw new Error('Unsupported payment mode returned by server');
      }
    } catch (err) {
      setFormError(err.message || 'Unable to start checkout.');
      if (/time|slot|reserved|unavailable|expired/i.test(String(err.message))) {
        setStep('form');
        setSelectedTime('');
        api.getGuestAvailableSlots(selectedDate, Number(serviceId), stylistId)
          .then((result) => setSlots(result.slots || [])).catch(() => setSlots([]));
      }
    } finally { setSubmittingCheckout(false); }
  };

  const finishDemo = async () => {
    if (!checkout?.id || !checkout?.token) return;
    setSubmittingCheckout(true); setFormError('');
    try {
      await api.finishGuestDemo(checkout.id, checkout.token);
      const status = await api.getGuestCheckoutStatus(checkout.referenceCode, checkout.token);
      setCheckoutStatus(status);
      setStep('result');
    } catch (err) { setFormError(err.message || 'Demo checkout failed.'); }
    finally { setSubmittingCheckout(false); }
  };

  const refreshStatus = async () => {
    if (!checkout?.referenceCode || !checkout?.token) return;
    setSubmittingCheckout(true); setFormError('');
    try { setCheckoutStatus(await api.getGuestCheckoutStatus(checkout.referenceCode, checkout.token)); }
    catch (err) { setFormError(err.message || 'Unable to check payment status.'); }
    finally { setSubmittingCheckout(false); }
  };

  const handleResetAndClose = () => {
    setStep('form');
    onClose();
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className={`${modalSurface} rounded-3xl border shadow-2xl relative transition-all duration-300 w-full overflow-hidden ${
        step === 'form' ? 'max-w-5xl' : 'max-w-md'
      }`}>
        
        {/* Close Button */}
        <button 
          onClick={handleResetAndClose} 
          aria-label="Close modal"
          className={`absolute top-4 right-4 z-10 p-2 ${isDarkMode ? 'text-[#D6D0C8] hover:text-white bg-[#302D29] hover:bg-[#403B34]' : 'text-[#2A1E1B]/60 hover:text-[#2A1E1B] bg-white/80 hover:bg-white'} rounded-full transition-colors shadow-sm`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* STEP 1: Main Form */}
        {step === 'form' && (
          <div className="p-6 sm:p-8">
            <div className="mb-6">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#C5A059] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Book Appointment
              </span>
              <h2 className={`text-2xl sm:text-3xl font-bold ${primaryText} mt-1`}>Schedule Your Session</h2>
            </div>

            <form onSubmit={handleFormSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              
              {/* Calendar Column */}
              <div className={`lg:col-span-5 ${insetSurface} flex flex-col self-start rounded-2xl border p-4 shadow-inner`}>
                <div>
                  <div className="flex items-center justify-between mb-4 px-1">
                    <button 
                      type="button" 
                      onClick={prevMonth}
                      disabled={isCurrentMonth}
                      className={`p-1.5 ${isDarkMode ? 'hover:bg-[#39352F] text-[#F5F1EA]' : 'hover:bg-[#E8DFD1] text-[#2A1E1B]'} disabled:opacity-30 rounded-full transition-colors`}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <span className={`font-bold ${primaryText} text-base`}>
                      {monthName} {currentYear}
                    </span>

                    <button 
                      type="button" 
                      onClick={nextMonth}
                      className={`p-1.5 ${isDarkMode ? 'hover:bg-[#39352F] text-[#F5F1EA]' : 'hover:bg-[#E8DFD1] text-[#2A1E1B]'} rounded-full transition-colors`}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  <div className={`grid grid-cols-7 text-center text-[11px] font-bold ${isDarkMode ? 'text-[#C9C1B5]' : 'text-[#2A1E1B]/60'} mb-2`}>
                    <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {paddingDays.map((pDay, idx) => (
                      <span key={`pad-${idx}`} className={`py-2 ${isDarkMode ? 'text-[#6F6A63]' : 'text-gray-300'} font-light select-none`}>
                        {pDay}
                      </span>
                    ))}

                    {daysArray.map((day) => {
                      const isSelected = selectedDay === day;
                      const disabled = isPastDay(day);

                      return (
                        <button
                          type="button"
                          key={day}
                          disabled={disabled}
                          onClick={() => { setSelectedDay(day); setSelectedTime(''); }}
                          className={`py-2 rounded-full text-xs font-semibold transition-all ${
                            disabled 
                              ? `${isDarkMode ? 'text-[#6F6A63]' : 'text-gray-300'} cursor-not-allowed line-through` 
                              : isSelected 
                                ? `${isDarkMode ? 'bg-[#3A342B] text-[#E8C77E] ring-1 ring-[#8D7444]' : 'bg-[#2A1E1B] text-[#C5A059]'} shadow-md font-bold scale-105` 
                                : `${isDarkMode ? 'text-[#F5F1EA] hover:bg-[#39352F]' : 'text-[#2A1E1B] hover:bg-[#E8DFD1]/80'} hover:scale-105`
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className={`mt-4 border-t pt-3 ${isDarkMode ? 'border-[#3A342B] text-[#D6D0C8]' : 'border-[#E8DFD1] text-[#2A1E1B]/80'} flex items-center justify-between text-xs`}>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-[#C5A059]" />
                    <span>Selected Date:</span>
                  </div>
                  <strong className={`${primaryText}`}>
                    {monthName} {selectedDay}, {currentYear}
                  </strong>
                </div>
              </div>

              {/* Time Slots Column */}
              <div className="flex flex-col justify-between space-y-3 lg:col-span-3 lg:pt-10">
                <div>
                  <div className={`border-b ${isDarkMode ? 'border-[#3A342B]' : 'border-[#E8DFD1]'} pb-2 mb-3`}>
                    <h3 className={`text-sm font-bold ${primaryText} flex items-center gap-1.5`}>
                      <Clock className="w-4 h-4 text-[#C5A059]" /> Appointment Time
                    </h3>
                  </div>

                  <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1 custom-scrollbar">
                    {!stylistId && <p className={`text-xs text-center py-3 ${mutedText}`}>Select a specialist to view real appointment availability.</p>}
                    {loadingSlots && <p role="status" className={`text-xs text-center py-3 ${mutedText}`}>Checking real availability…</p>}
                    {slotsError && <p role="alert" className="text-xs text-red-500">Could not load times: {slotsError}</p>}
                    {!loadingSlots && stylistId && !slotsError && !slots.length && <p className={`text-xs text-center py-3 ${mutedText}`}>No appointment times available for this date, service, and specialist.</p>}
                    {slots.map((slot) => {
                      const isSelected = selectedTime === slot.startTime;
                      const disabled = !slot.available || loadingSlots;

                      return (
                        <button
                          type="button"
                          key={slot.startTime}
                          disabled={disabled}
                          onClick={() => setSelectedTime(slot.startTime)}
                          className={`w-full py-2.5 px-3 rounded-xl text-xs text-center font-medium transition-all ${
                            disabled
                              ? `${isDarkMode ? 'bg-[#302D29] text-[#817B72] border-[#403B34]' : 'bg-gray-100 text-gray-400 border-gray-200'} border cursor-not-allowed line-through`
                              : isSelected
                                ? `${isDarkMode ? 'bg-[#3A342B] text-[#E8C77E] border-[#8D7444]' : 'bg-[#2A1E1B] text-[#C5A059] border-[#C5A059]'} shadow-md font-bold border`
                                : `${isDarkMode ? 'bg-[#242220] text-[#F5F1EA] border-[#3A342B]' : 'bg-white text-[#2A1E1B] border-[#E8DFD1]'} border hover:border-[#C5A059]`
                          }`}
                        >
                          {formatClock(slot.startTime)}{!slot.available ? ' (Unavailable)' : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Client Details Column */}
              <div className="space-y-5 lg:col-span-4">
                <div className={`border-b ${isDarkMode ? 'border-[#3A342B]' : 'border-[#E8DFD1]'} pb-2`}>
                  <h3 className={`text-sm font-bold ${primaryText}`}>Your Details</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={`block text-[10px] font-bold ${isDarkMode ? 'text-[#A9A39B]' : 'text-gray-500'} uppercase tracking-wider mb-1`}>
                      Category
                    </label>
                    <select 
                      value={category} 
                      onChange={handleCategoryChange}
                      className={`w-full px-3 py-2.5 rounded-xl border ${fieldStyle} text-xs font-medium focus:outline-none focus:border-[#C5A059]`}
                    >
                      {!serviceGroups.length && <option value="">No services loaded</option>}
                      {serviceGroups.map((group) => (
                        <option key={group.id} value={String(group.id)}>{group.category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold ${isDarkMode ? 'text-[#A9A39B]' : 'text-gray-500'} uppercase tracking-wider mb-1`}>
                      Service
                    </label>
                    <select
                      value={serviceId}
                      onChange={(e) => { setServiceId(e.target.value); setSelectedTime(''); }}
                      required
                      className={`w-full px-3 py-2.5 rounded-xl border ${fieldStyle} text-xs font-medium focus:outline-none focus:border-[#C5A059]`}
                    >
                      {!categoryServices.length && <option value="">No services available</option>}
                      {categoryServices.map((service) => (
                        <option key={service.id} value={String(service.id)}>
                          {service.name} (₱{Number(service.price).toLocaleString('en-PH')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold ${isDarkMode ? 'text-[#A9A39B]' : 'text-gray-500'} uppercase tracking-wider mb-1`}>
                      Full Name
                    </label>
                    <div className="relative">
                      <User className={`w-3.5 h-3.5 absolute left-3 top-3 ${isDarkMode ? 'text-[#A9A39B]' : 'text-gray-400'}`} />
                      <input 
                        type="text" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required 
                        placeholder="e.g. Sophia Loren"
                        className={`w-full pl-8 pr-3 py-2 rounded-xl border ${fieldStyle} text-xs focus:outline-none focus:border-[#C5A059]`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold ${isDarkMode ? 'text-[#A9A39B]' : 'text-gray-500'} uppercase tracking-wider mb-1`}>
                      Contact Info
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={(e) => {
                          const value = e.target.value;
                          setPhone(value);
                          setPhoneError(getPhoneError(value));
                        }}
                        onBlur={() => setPhoneError(getPhoneError(phone))}
                        onInvalid={(event) => {
                          event.preventDefault();
                          setPhoneError(getPhoneError(phone));
                        }}
                        aria-invalid={Boolean(phoneError)}
                        aria-describedby={phoneError ? 'booking-phone-error' : undefined}
                        required 
                        placeholder="Phone No."
                        className={`w-full px-3 py-2 rounded-xl border ${fieldStyle} ${phoneError ? '!border-red-500' : ''} text-xs focus:outline-none focus:border-[#C5A059]`}
                      />
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => {
                          const value = e.target.value;
                          setEmail(value);
                          setEmailError(getEmailError(value));
                        }}
                        onBlur={() => setEmailError(getEmailError(email))}
                        onInvalid={(event) => {
                          event.preventDefault();
                          setEmailError(getEmailError(email));
                        }}
                        aria-invalid={Boolean(emailError)}
                        aria-describedby={emailError ? 'booking-email-error' : undefined}
                        required 
                        placeholder="Email Address"
                        className={`w-full px-3 py-2 rounded-xl border ${fieldStyle} ${emailError ? '!border-red-500' : ''} text-xs focus:outline-none focus:border-[#C5A059]`}
                      />
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      <p id="booking-phone-error" aria-live="polite" className={`text-[11px] text-red-500 ${phoneError ? '' : 'invisible'}`}>
                        {phoneError || ' '}
                      </p>
                      <p id="booking-email-error" aria-live="polite" className={`text-[11px] text-red-500 ${emailError ? '' : 'invisible'}`}>
                        {emailError || ' '}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold ${isDarkMode ? 'text-[#A9A39B]' : 'text-gray-500'} uppercase tracking-wider mb-1`}>
                      Specialist Preference
                    </label>
                    <select
                      value={stylistId}
                      onChange={(e) => { setStylistId(e.target.value); setSelectedTime(''); }}
                      required
                      disabled={loadingStylists}
                      className={`w-full px-3 py-2 rounded-xl border ${fieldStyle} text-xs focus:outline-none focus:border-[#C5A059]`}
                    >
                      <option value="">{loadingStylists ? 'Loading specialists…' : 'Choose a specialist'}</option>
                      {stylists.map((item) => <option key={item.id} value={String(item.id)}>{item.name}</option>)}
                    </select>
                    {!loadingStylists && !stylists.length && <p role="alert" className="mt-1 text-xs text-red-500">No active STAFF specialists are available.</p>}
                    <p className={`mt-1 text-[10px] ${mutedText}`}>Times are checked for your selected specialist. Published shifts and leave are not yet configured.</p>
                  </div>

                  {servicesError && <p role="alert" className="text-xs text-red-500">Unable to load services: {servicesError}</p>}
                  {formError && <p role="alert" className="text-xs text-red-500">{formError}</p>}
                  <button 
                    type="submit"
                    disabled={loadingServices || loadingStylists || loadingSlots || checkingSlot || !currentServiceObj || !chosenStylist || !selectedSlot}
                    className={`w-full !mt-6 py-3.5 rounded-2xl ${primaryButton} disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-[11px] transition-all shadow-md flex items-center justify-center gap-2 group`}
                  >
                    <span>{checkingSlot ? 'Verifying selected time…' : 'Review Appointment & 50% Deposit'}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

            </form>
          </div>
        )}

        {/* STEP 2: Payment Review & Breakdown */}
        {step === 'confirm' && (
          <div className="p-8 text-center space-y-6">
            <div className={`w-14 h-14 ${insetSurface} text-[#C5A059] rounded-full flex items-center justify-center mx-auto border shadow-sm`}>
              <CreditCard className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#C5A059]">Deposit Payment</span>
              <h3 className={`text-xl font-bold ${primaryText}`}>
                50% Partial Payment
              </h3>
              <p className={`text-xs ${mutedText} max-w-xs mx-auto`}>
                Confirm your details to hold this appointment briefly and start a TEST payment. No real payment is collected in demo mode.
              </p>
            </div>

            <div className={`${insetSurface} p-4 rounded-2xl border text-xs text-left space-y-2`}>
              <div className={`flex justify-between border-b ${isDarkMode ? 'border-[#3A342B]' : 'border-[#E8DFD1]'} pb-2`}>
                <span className={mutedText}>Service:</span>
                <span className={`font-semibold ${primaryText}`}>{serviceTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className={mutedText}>Schedule:</span>
                <span className={`font-semibold ${primaryText}`}>{selectedDate} at {formatClock(selectedTime)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className={mutedText}>Assigned specialist:</span>
                <span className={`font-semibold ${primaryText} text-right`}>{stylist}</span>
              </div>
              <div className="flex justify-between">
                <span className={mutedText}>Total Price:</span>
                <span className={`font-semibold ${primaryText}`}>₱{totalPriceNumber.toFixed(2)}</span>
              </div>
              <div className={`flex justify-between text-[#C5A059] font-bold text-sm pt-1 border-t ${isDarkMode ? 'border-[#3A342B]' : 'border-[#E8DFD1]'}`}>
                <span>50% Payable Now:</span>
                <span>₱{depositAmount.toFixed(2)}</span>
              </div>
              <div className={`flex justify-between ${isDarkMode ? 'text-[#A9A39B]' : 'text-gray-500'} text-[11px]`}>
                <span>Remaining Balance at Salon:</span>
                <span>₱{balanceRemaining.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 max-w-xs mx-auto">
              <p className={`text-xs ${mutedText}`}>
                The backend will recheck this specialist and time, then hold your slot for 15 minutes during TEST checkout.
              </p>
              {formError && <p role="alert" className="text-xs text-red-500">{formError}</p>}
              <button
                type="button"
                onClick={beginCheckout}
                disabled={submittingCheckout}
                className={`w-full py-3.5 rounded-2xl ${primaryButton} disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xs tracking-widest uppercase transition-all shadow-md flex items-center justify-center gap-2`}
              >
                {submittingCheckout && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{submittingCheckout ? 'Preparing secure test checkout…' : 'Continue to 50% test deposit'}</span>
              </button>
              
              <button 
                onClick={() => setStep('form')}
                className={`w-full py-2.5 rounded-2xl border ${isDarkMode ? 'bg-[#242220] border-[#3A342B] hover:bg-[#302D29] text-[#F5F1EA]' : 'bg-white border-[#E8DFD1] hover:bg-[#F6F0E6] text-[#2A1E1B]'} font-medium text-xs transition-colors`}
              >
                Go Back & Edit
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Explicit no-money demo, only if enabled on the backend. */}
        {step === 'demo' && (
          <div className="p-8 text-center space-y-5">
            <CreditCard className="w-12 h-12 mx-auto text-[#C5A059]" />
            <h3 className={`text-xl font-bold ${primaryText}`}>Temporary PayMongo Demo</h3>
            <p className={`text-xs ${mutedText}`}>Prototype only. The next action simulates a deposit; it does not contact PayMongo or charge any money.</p>
            <div className={`${insetSurface} p-4 rounded-2xl border text-sm space-y-2`}>
              <p>Booking: <strong>{checkout?.referenceCode}</strong></p>
              <p>Specialist: <strong>{checkout?.stylistName}</strong></p>
              <p>Simulated 50% deposit: <strong>₱{Number(checkout?.depositAmount || 0).toFixed(2)}</strong></p>
            </div>
            {formError && <p role="alert" className="text-xs text-red-500">{formError}</p>}
            <button type="button" disabled={submittingCheckout} onClick={finishDemo} className={`w-full py-3.5 rounded-2xl ${primaryButton} font-bold text-xs disabled:opacity-50`}>
              {submittingCheckout ? 'Processing demo…' : 'Simulate successful TEST deposit'}
            </button>
            <button type="button" onClick={handleResetAndClose} className={`w-full py-2 rounded-xl border ${fieldStyle}`}>Close</button>
          </div>
        )}

        {/* STEP 4: A browser redirect never verifies a payment: server status does. */}
        {step === 'result' && (
          <div className="p-8 text-center space-y-5">
            {['DEMO_PAID', 'TEST_PAID'].includes(checkoutStatus?.paymentStatus)
              ? <CheckCircle2 className="w-12 h-12 mx-auto text-[#C5A059]" />
              : <AlertCircle className="w-12 h-12 mx-auto text-[#C5A059]" />}
            <h3 className={`text-xl font-bold ${primaryText}`}>Booking Payment Status</h3>
            <p className={`text-xs ${mutedText}`}>Reference: <strong>{checkoutStatus?.referenceCode || checkout?.referenceCode || 'Unavailable'}</strong></p>
            <p className={`text-xs ${mutedText}`}>
              {checkoutStatus?.paymentStatus === 'DEMO_PAID' ? 'DEMO deposit recorded; no money was charged. Appointment is pending stylist confirmation.'
              : checkoutStatus?.paymentStatus === 'TEST_PAID' ? 'PayMongo TEST deposit was verified by the backend. Appointment is pending stylist confirmation.'
              : checkoutStatus?.status === 'PAYMENT_REVIEW' ? 'A test payment was received but the slot requires manual review; contact the salon.'
              : checkoutStatus?.holdExpired ? 'The temporary reservation expired. Start a new booking.'
              : 'Payment is not yet verified. A redirect back to the salon is not proof of payment.'}
            </p>
            {formError && <p role="alert" className="text-xs text-red-500">{formError}</p>}
            {checkoutStatus?.paymentStatus !== 'DEMO_PAID' && checkoutStatus?.paymentStatus !== 'TEST_PAID' &&
              <button type="button" onClick={refreshStatus} disabled={submittingCheckout} className={`w-full py-3 rounded-xl ${primaryButton} font-bold text-xs`}>
                {submittingCheckout ? 'Checking…' : 'Refresh payment status'}
              </button>}
            <button type="button" onClick={handleResetAndClose} className={`w-full py-2 rounded-xl border ${fieldStyle}`}>Close</button>
          </div>
        )}

      </div>
    </div>
  );
}

export default BookingModal;
