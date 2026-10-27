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
  embedded = false,
}) {
  const [serviceGroups, setServiceGroups] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [servicesError, setServicesError] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [appointmentDate, setAppointmentDate] = useState(getSalonDate);
  const [availability, setAvailability] = useState({});
  const [selectedTimes, setSelectedTimes] = useState({});
  const [createdServiceIds, setCreatedServiceIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const services = useMemo(
    () => (Array.isArray(serviceGroups) ? serviceGroups : [])
      .flatMap((group) => Array.isArray(group?.services) ? group.services : []),
    [serviceGroups],
  );
  const fullName = user?.fullName || user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Member';
  const initials = fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const profilePhoto = (() => { try { return localStorage.getItem(`centyzz-member-avatar:${user?.id ?? user?.email ?? 'member'}`) || ''; } catch { return ''; } })();
  const selectedServices = selectedServiceIds.map((id) => services.find((item) => String(item.id) === String(id))).filter(Boolean);
  const isLoadingSlots = selectedServiceIds.some((id) => !availability[`${appointmentDate}:${id}`]);

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
        const groups = Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
            ? result.data
            : [];
        setServiceGroups(groups);
        const requested = Array.isArray(selectedService) ? selectedService : selectedService ? [selectedService] : [];
        const availableServices = groups.flatMap((group) => Array.isArray(group?.services) ? group.services : []);
        const matches = requested.map((requestedService) => {
          const requestedName = String(requestedService?.title || requestedService?.name || '').toLowerCase();
          return availableServices.find((item) => String(item?.id) === String(requestedService?.id))
            || availableServices.find((item) => requestedName && String(item?.name || '').toLowerCase() === requestedName);
        }).filter(Boolean);
        setSelectedServiceIds(matches.map((item) => String(item.id)));
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
    if (!selectedServiceIds.length || !appointmentDate) return undefined;
    let isCurrent = true;
    Promise.all(selectedServiceIds.map(async (id) => {
      try {
        const result = await api.getAvailableSlots(appointmentDate, id);
        return [id, { slots: result.slots || [] }];
      } catch (error) {
        return [id, { slots: [], error: error.message }];
      }
    })).then((results) => {
      if (isCurrent) setAvailability((current) => ({
        ...current,
        ...Object.fromEntries(results.map(([id, value]) => [`${appointmentDate}:${id}`, value])),
      }));
    });
    return () => {
      isCurrent = false;
    };
  }, [appointmentDate, selectedServiceIds]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    if (!user?.accessToken) {
      setFormError('Please sign in with a registered account to book an appointment.');
      return;
    }
    if (!selectedServices.length || selectedServices.some((item) => !selectedTimes[item.id])) {
      setFormError('Choose an available time for every selected service.');
      return;
    }

    setIsSubmitting(true);
    let createdCount = 0;
    try {
      for (const selected of selectedServices) {
        if (createdServiceIds.includes(selected.id)) continue;
        await api.createMyAppointment(user.accessToken, {
          serviceId: Number(selected.id),
          customerName: fullName,
          customerEmail: user.email,
          appointmentDate,
          startTime: selectedTimes[selected.id],
        });
        createdCount += 1;
        setCreatedServiceIds((ids) => [...ids, selected.id]);
      }
      onAppointmentCreated?.();
      setActivePage('member-bookings');
    } catch (error) {
      const completed = createdServiceIds.length + createdCount;
      setFormError(completed ? `${completed} appointment(s) were saved. The remaining service could not be booked: ${error.message}` : error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const service = selectedServices[0];
  const selectedTime = selectedServices
    .map((item) => selectedTimes[item.id])
    .filter(Boolean)
    .join(', ');
  const hasAllSelectedTimes = selectedServices.length > 0
    && selectedServices.every((item) => selectedTimes[item.id]);

  return (
    <div className={`${embedded ? "min-h-0" : "min-h-screen pb-24 lg:flex lg:pb-0"} ${surface}`}>
      {!embedded && <aside className={`relative hidden w-20 shrink-0 flex-col border-r lg:sticky lg:top-0 lg:flex lg:h-screen ${sidebarSurface}`}>
        <div className="flex h-16 items-center justify-center border-b border-inherit">
          <img src="/logo.png" alt="Centy'zz Salon" className="h-10 w-10 rounded-full object-cover" />
        </div>
        <div className="flex justify-center border-b border-inherit py-4">
          <div aria-label={`${fullName} profile`} role="img" className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#C5A059] bg-[#4A3928] text-[10px] font-semibold text-white">
            {profilePhoto ? <img src={profilePhoto} alt="" className="h-full w-full rounded-full object-cover" /> : (initials || 'M')}
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
            const active = item.page === 'member-bookings';
            return (
              <button key={item.page} type="button" title={item.label} aria-current={active ? 'page' : undefined} onClick={() => setActivePage(item.page)} className={`flex h-10 items-center justify-center rounded-lg transition-colors ${active ? 'bg-[#4A3928] text-white' : 'text-[#8A8174] hover:bg-[#C5A059]/15 hover:text-[#4A3928]'}`}>
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </nav>
        <button type="button" onClick={onLogout} aria-label="Log out" className="mb-3 flex h-10 items-center justify-center text-red-600 hover:bg-red-50 hover:text-red-700">
          <LogOut className="h-4 w-4" />
        </button>
      </aside>}

      <main className={`min-w-0 flex-1 px-3 py-4 sm:px-6 sm:py-5 ${embedded ? "lg:px-6" : "lg:px-8"}`}>
        <div className="mx-auto max-w-5xl">
          <header className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {!embedded && <button type="button" onClick={() => setActivePage('member-bookings')} aria-label="Back to bookings" className="text-[#8A8174] hover:text-[#C5A059]">
                <ArrowLeft className="h-5 w-5" />
              </button>}
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
                <label htmlFor="member-book-service" className="mb-2 block text-xs font-semibold">Selected services</label>
                {isLoadingServices ? (
                  <p role="status" className={`text-sm ${mutedText}`}>Loading services...</p>
                ) : servicesError ? (
                  <p role="alert" className="text-sm text-red-600">{servicesError}</p>
                ) : (
                  <div id="member-book-service" className={`max-h-52 space-y-2 overflow-y-auto rounded-lg border p-3 ${inputSurface}`}>
                    {serviceGroups.map((group) => (
                      <fieldset key={group.id} className="space-y-1.5">
                        <legend className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[#C5A059]">{group.category}</legend>
                        {(group.services || []).map((item) => (
                          <option key={item.id} value={item.id}>{item.name} · ₱{Number(item.price).toFixed(2)}</option>
                        ))}
                      </fieldset>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="member-book-date" className="mb-2 block text-xs font-semibold">Appointment date</label>
                <input id="member-book-date" type="date" min={getSalonDate()} value={appointmentDate} onChange={(event) => { setAppointmentDate(event.target.value); setSelectedTimes({}); setAvailability({}); }} required className={`w-full rounded-lg border px-3 py-2.5 text-sm ${inputSurface}`} />
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#C5A059]" />
                  <h2 className="text-xs font-semibold">Available times</h2>
                </div>
                {!selectedServiceIds.length ? (
                  <p className={`text-sm ${mutedText}`}>Select one or more services to view available times.</p>
                ) : isLoadingSlots ? (
                  <p role="status" className={`text-sm ${mutedText}`}>Checking availability...</p>
                ) : (
                  <div className="space-y-4">{selectedServices.map((item) => {
                    const slotData = availability[`${appointmentDate}:${item.id}`];
                    const duration = Number(item.durationMinutes) || 0;
                    const toMinutes = (time) => { const [hour, minute] = time.split(':').map(Number); return hour * 60 + minute; };
                    return <section key={item.id} className={`rounded-lg border p-3 ${inputSurface}`}>
                      <h3 className="mb-2 text-xs font-semibold">{item.name}</h3>
                      {slotData?.error ? <p role="alert" className="text-xs text-red-600">{slotData.error}</p>
                        : !slotData?.slots?.length ? <p className={`text-xs ${mutedText}`}>No times are available for this date.</p>
                          : <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{slotData.slots.map((slot) => {
                            const start = toMinutes(slot.startTime);
                            const overlapsChosen = selectedServices.some((other) => {
                              if (String(other.id) === String(item.id) || !selectedTimes[other.id]) return false;
                              const otherStart = toMinutes(selectedTimes[other.id]);
                              const otherEnd = otherStart + (Number(other.durationMinutes) || 0);
                              return start < otherEnd && start + duration > otherStart;
                            });
                            return <button key={slot.startTime} type="button" disabled={!slot.available || overlapsChosen} onClick={() => setSelectedTimes((times) => ({ ...times, [item.id]: slot.startTime }))} className={`min-h-11 rounded-lg border px-3 py-2.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${selectedTimes[item.id] === slot.startTime ? 'border-[#4A3928] bg-[#4A3928] text-white' : `${inputSurface} hover:border-[#C5A059]`}`}>
                              {slot.startTime}
                            </button>;
                          })}</div>}
                    </section>;
                  })}</div>
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
                  <div className="flex justify-between gap-3"><dt>Service</dt><dd className="text-right font-medium">{selectedServices.map((item) => item.name).join(', ') || 'Not selected'}</dd></div>
                  <div className="flex justify-between gap-3"><dt>Date</dt><dd className="text-right font-medium">{formatDate(appointmentDate)}</dd></div>
                  <div className="flex justify-between gap-3"><dt>Time</dt><dd className="text-right font-medium">{selectedTime || 'Not selected'}</dd></div>
                </dl>
                {service && <p className="mt-4 border-t border-inherit pt-3 text-sm font-bold">₱{Number(service.price).toFixed(2)}</p>}
              </section>
              <button type="submit" disabled={isSubmitting || isLoadingServices || !service || !hasAllSelectedTimes} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#4A3928] px-4 py-3 text-xs font-semibold text-white transition-colors hover:bg-[#725334] disabled:cursor-not-allowed disabled:opacity-50">
                {isSubmitting ? 'Saving appointment...' : <><Check className="h-4 w-4" /> Confirm appointment</>}
              </button>
            </aside>
          </form>
        </div>
      </main>

      {!embedded && <nav aria-label="Member mobile navigation" className="fixed bottom-3 left-1/2 z-40 flex w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 items-center justify-around rounded-full border border-white/10 bg-[#4A3928]/95 px-2 py-1.5 text-white shadow-xl backdrop-blur-md lg:hidden">
        <button type="button" onClick={() => setActivePage('home')} className="flex flex-col items-center p-2 text-[10px]"><Home className="h-5 w-5" /><span>Home</span></button>
        <button type="button" onClick={() => setActivePage('member-services')} className="flex flex-col items-center p-2 text-[10px]"><Scissors className="h-5 w-5" /><span>Services</span></button>
        <button type="button" onClick={() => setActivePage('member-bookings')} aria-current="page" className="flex flex-col items-center p-2 text-[10px] font-bold text-[#F1E7C6]"><CalendarDays className="h-5 w-5" /><span>Bookings</span></button>
        <button type="button" onClick={() => setActivePage('member-account')} className="flex flex-col items-center p-2 text-[10px]"><UserRound className="h-5 w-5" /><span>Account</span></button>
      </nav>}
    </div>
  );
}
