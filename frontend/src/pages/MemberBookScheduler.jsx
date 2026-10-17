import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock,
  Home,
  LogOut,
  Moon,
  Scissors,
  Sun,
  UserRound,
} from 'lucide-react';
import { api } from '../api/client.js';

const getSalonDate = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Manila',
}).format(new Date());

const formatDate = (date) => new Date(`${date}T12:00:00+08:00`).toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

export default function MemberBookScheduler({
  user,
  isDarkMode,
  setIsDarkMode,
  setActivePage,
  onLogout,
  selectedService,
  onAppointmentCreated,
}) {
  const [serviceGroups, setServiceGroups] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [servicesError, setServicesError] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(getSalonDate);
  const [availability, setAvailability] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const services = useMemo(
    () => serviceGroups.flatMap((group) => group.services || []),
    [serviceGroups],
  );
  const fullName = user?.fullName || user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Member';
  const initials = fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const currentQuery = `${appointmentDate}:${selectedServiceId}`;
  const currentAvailability = availability?.query === currentQuery ? availability : null;
  const timeSlots = currentAvailability?.slots || [];
  const isLoadingSlots = Boolean(selectedServiceId && appointmentDate && !currentAvailability);
  const service = services.find((item) => String(item.id) === selectedServiceId);

  const surface = isDarkMode ? 'bg-[#171512] text-[#F5F1EA]' : 'bg-[#F6F4EF] text-[#443523]';
  const cardSurface = isDarkMode ? 'border-[#39342B] bg-[#211F1B]' : 'border-[#E9E4D8] bg-white';
  const sidebarSurface = isDarkMode ? 'border-[#39342B] bg-[#1D1A16]' : 'border-[#E9E4D8] bg-[#FFFDF8]';
  const mutedText = isDarkMode ? 'text-[#C9C1B5]' : 'text-[#8A8174]';
  const inputSurface = isDarkMode
    ? 'border-[#39342B] bg-[#2A2723] text-[#F5F1EA]'
    : 'border-[#E9E4D8] bg-[#FDFBF7] text-[#443523]';

  useEffect(() => {
    let isCurrent = true;
    api.getServices()
      .then((result) => {
        if (!isCurrent) return;
        const groups = Array.isArray(result) ? result : [];
        setServiceGroups(groups);
        const requestedName = String(selectedService?.title || selectedService?.name || '').toLowerCase();
        const match = groups.flatMap((group) => group.services || []).find((item) =>
          String(item.id) === String(selectedService?.id) ||
          (requestedName && item.name.toLowerCase() === requestedName),
        );
        if (match) setSelectedServiceId(String(match.id));
      })
      .catch((error) => {
        if (isCurrent) setServicesError(error.message);
      })
      .finally(() => {
        if (isCurrent) setIsLoadingServices(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [selectedService]);

  useEffect(() => {
    if (!selectedServiceId || !appointmentDate) return undefined;
    let isCurrent = true;
    api.getAvailableSlots(appointmentDate, selectedServiceId)
      .then((result) => {
        if (isCurrent) setAvailability({ query: currentQuery, slots: result.slots || [] });
      })
      .catch((error) => {
        if (isCurrent) setAvailability({ query: currentQuery, slots: [], error: error.message });
      });
    return () => {
      isCurrent = false;
    };
  }, [appointmentDate, currentQuery, selectedServiceId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    if (!user?.accessToken) {
      setFormError('Please sign in with a registered account to book an appointment.');
      return;
    }
    if (!service || !selectedTime) {
      setFormError('Choose a service and an available time.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createMyAppointment(user.accessToken, {
        serviceId: Number(service.id),
        customerName: fullName,
        customerEmail: user.email,
        appointmentDate,
        startTime: selectedTime,
      });
      onAppointmentCreated?.();
      setActivePage('member-bookings');
    } catch (error) {
      setFormError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen pb-24 lg:flex lg:pb-0 ${surface}`}>
      <aside className={`relative hidden w-20 shrink-0 flex-col border-r lg:sticky lg:top-0 lg:flex lg:h-screen ${sidebarSurface}`}>
        <div className="flex h-16 items-center justify-center border-b border-inherit">
          <img src="/logo.png" alt="Centy'zz Salon" className="h-10 w-10 rounded-full object-cover" />
        </div>
        <div className="flex justify-center border-b border-inherit py-4">
          <div aria-label={`${fullName} profile`} role="img" className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#C5A059] bg-[#4A3928] text-[10px] font-semibold text-white">
            {initials || 'M'}
          </div>
        </div>
        <nav aria-label="Member navigation" className="flex flex-1 flex-col gap-1.5 p-3">
          {[
            { label: 'Home', icon: Home, page: 'home' },
            { label: 'Services', icon: Scissors, page: 'member-services' },
            { label: 'Bookings', icon: CalendarDays, page: 'member-bookings' },
            { label: 'Account', icon: UserRound, page: 'member-account' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.page} type="button" title={item.label} onClick={() => setActivePage(item.page)} className="flex h-10 items-center justify-center rounded-lg text-[#8A8174] transition-colors hover:bg-[#C5A059]/15 hover:text-[#4A3928]">
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </nav>
        <button type="button" onClick={onLogout} aria-label="Log out" className="mb-3 flex h-10 items-center justify-center text-red-600/80 hover:bg-red-500/10">
          <LogOut className="h-4 w-4" />
        </button>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <header className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setActivePage('member-bookings')} aria-label="Back to bookings" className="text-[#8A8174] hover:text-[#C5A059]">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold">Book an appointment</h1>
                <p className={`mt-0.5 text-xs ${mutedText}`}>Choose a service, date, and available time.</p>
              </div>
            </div>
            <button type="button" onClick={() => setIsDarkMode((current) => !current)} aria-label="Toggle dark mode" className={`rounded-full border p-2.5 ${cardSurface}`}>
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </header>

          <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <section className={`space-y-6 rounded-xl border p-5 sm:p-6 ${cardSurface}`}>
              <div>
                <label htmlFor="member-book-service" className="mb-2 block text-xs font-semibold">Service</label>
                {isLoadingServices ? (
                  <p role="status" className={`text-sm ${mutedText}`}>Loading services...</p>
                ) : servicesError ? (
                  <p role="alert" className="text-sm text-red-600">{servicesError}</p>
                ) : (
                  <select id="member-book-service" value={selectedServiceId} onChange={(event) => { setSelectedServiceId(event.target.value); setSelectedTime(''); setAvailability(null); }} required className={`w-full rounded-lg border px-3 py-2.5 text-sm ${inputSurface}`}>
                    <option value="">Choose a service</option>
                    {serviceGroups.map((group) => (
                      <optgroup key={group.id} label={group.category}>
                        {(group.services || []).map((item) => (
                          <option key={item.id} value={item.id}>{item.name} · ₱{Number(item.price).toFixed(2)}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label htmlFor="member-book-date" className="mb-2 block text-xs font-semibold">Appointment date</label>
                <input id="member-book-date" type="date" min={getSalonDate()} value={appointmentDate} onChange={(event) => { setAppointmentDate(event.target.value); setSelectedTime(''); setAvailability(null); }} required className={`w-full rounded-lg border px-3 py-2.5 text-sm ${inputSurface}`} />
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#C5A059]" />
                  <h2 className="text-xs font-semibold">Available times</h2>
                </div>
                {!selectedServiceId ? (
                  <p className={`text-sm ${mutedText}`}>Select a service to view available times.</p>
                ) : isLoadingSlots ? (
                  <p role="status" className={`text-sm ${mutedText}`}>Checking availability...</p>
                ) : currentAvailability?.error ? (
                  <p role="alert" className="text-sm text-red-600">{currentAvailability.error}</p>
                ) : timeSlots.length === 0 ? (
                  <p className={`text-sm ${mutedText}`}>No times are available for this date.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {timeSlots.map((slot) => (
                      <button key={slot.startTime} type="button" disabled={!slot.available} onClick={() => setSelectedTime(slot.startTime)} className={`rounded-lg border px-3 py-2.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${selectedTime === slot.startTime ? 'border-[#4A3928] bg-[#4A3928] text-white' : `${inputSurface} hover:border-[#C5A059]`}`}>
                        {slot.startTime}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {formError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{formError}</p>}
            </section>

            <aside className="space-y-4">
              <section className={`rounded-xl border p-5 ${cardSurface}`}>
                <h2 className="text-sm font-bold">Appointment summary</h2>
                <dl className={`mt-4 space-y-3 text-xs ${mutedText}`}>
                  <div className="flex justify-between gap-3"><dt>Member</dt><dd className="text-right font-medium">{fullName}</dd></div>
                  <div className="flex justify-between gap-3"><dt>Email</dt><dd className="break-all text-right font-medium">{user?.email || 'Not provided'}</dd></div>
                  <div className="flex justify-between gap-3"><dt>Service</dt><dd className="text-right font-medium">{service?.name || 'Not selected'}</dd></div>
                  <div className="flex justify-between gap-3"><dt>Date</dt><dd className="text-right font-medium">{formatDate(appointmentDate)}</dd></div>
                  <div className="flex justify-between gap-3"><dt>Time</dt><dd className="text-right font-medium">{selectedTime || 'Not selected'}</dd></div>
                </dl>
                {service && <p className="mt-4 border-t border-inherit pt-3 text-sm font-bold">₱{Number(service.price).toFixed(2)}</p>}
              </section>
              <button type="submit" disabled={isSubmitting || isLoadingServices || !service || !selectedTime} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#4A3928] px-4 py-3 text-xs font-semibold text-white transition-colors hover:bg-[#725334] disabled:cursor-not-allowed disabled:opacity-50">
                {isSubmitting ? 'Saving appointment...' : <><Check className="h-4 w-4" /> Confirm appointment</>}
              </button>
            </aside>
          </form>
        </div>
      </main>

      <nav aria-label="Member mobile navigation" className="fixed bottom-4 left-1/2 z-40 flex w-[90%] max-w-sm -translate-x-1/2 items-center justify-around rounded-full border border-white/10 bg-[#4A3928]/95 px-3 py-2 text-white shadow-xl backdrop-blur-md lg:hidden">
        <button type="button" onClick={() => setActivePage('home')} className="flex flex-col items-center p-2 text-[10px]"><Home className="h-5 w-5" /><span>Home</span></button>
        <button type="button" onClick={() => setActivePage('member-services')} className="flex flex-col items-center p-2 text-[10px]"><Scissors className="h-5 w-5" /><span>Services</span></button>
        <button type="button" onClick={() => setActivePage('member-bookings')} className="flex flex-col items-center p-2 text-[10px] text-[#F1E7C6]"><CalendarDays className="h-5 w-5" /><span>Bookings</span></button>
        <button type="button" onClick={() => setActivePage('member-account')} className="flex flex-col items-center p-2 text-[10px]"><UserRound className="h-5 w-5" /><span>Account</span></button>
      </nav>
    </div>
  );
}
