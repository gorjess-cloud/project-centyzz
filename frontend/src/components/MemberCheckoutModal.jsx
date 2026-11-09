import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock3, LoaderCircle, Scissors, UserRound, X } from 'lucide-react';
import { api } from '../api/client.js';

const salonDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date());
const money = (value) => `₱${Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
const toMinutes = (time) => { const [hours, minutes] = String(time).split(':').map(Number); return hours * 60 + minutes; };

export default function MemberCheckoutModal({ isOpen, onClose, services = [], user, isDarkMode, onComplete }) {
  const [stylists, setStylists] = useState([]);
  const [stylistId, setStylistId] = useState('');
  const [date, setDate] = useState(salonDate);
  const [slotsByService, setSlotsByService] = useState({});
  const [times, setTimes] = useState({});
  const [step, setStep] = useState('details');
  const [error, setError] = useState('');
  const [loadingStylists, setLoadingStylists] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdServiceIds, setCreatedServiceIds] = useState([]);

  const total = useMemo(() => services.reduce((sum, item) => sum + Number(item.price || 0), 0), [services]);
  const fullName = user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Member';
  const stylist = stylists.find((item) => String(item.id) === String(stylistId));
  const surface = isDarkMode ? 'border-[#39342B] bg-[#211F1B] text-[#F5F1EA]' : 'border-[#E9E4D8] bg-[#FFFDF8] text-[#443523]';
  const field = isDarkMode ? 'border-[#51493B] bg-[#2A2723] text-[#F5F1EA]' : 'border-[#E9E4D8] bg-white text-[#443523]';
  const muted = isDarkMode ? 'text-[#C9C1B5]' : 'text-[#8A8174]';

  useEffect(() => {
    if (!isOpen) return undefined;
    let active = true;
    api.getGuestStylists()
      .then((result) => { if (active) setStylists(Array.isArray(result) ? result : result?.data || []); })
      .catch((err) => { if (active) setError(`Could not load stylists: ${err.message}`); })
      .finally(() => { if (active) setLoadingStylists(false); });
    return () => { active = false; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !date || !stylistId || !services.length) return undefined;
    let active = true;
    Promise.resolve().then(async () => {
      if (!active) return;
      setLoadingSlots(true);
      const results = await Promise.all(services.map(async (service) => {
        try {
          const result = await api.getGuestAvailableSlots(date, Number(service.id), stylistId);
          return [String(service.id), result.slots || []];
        } catch (err) {
          return [String(service.id), { error: err.message }];
        }
      }));
      if (active) setSlotsByService(Object.fromEntries(results));
    }).finally(() => { if (active) setLoadingSlots(false); });
    return () => { active = false; };
  }, [isOpen, date, stylistId, services]);

  if (!isOpen) return null;

  const submit = async () => {
    setSubmitting(true);
    setError('');
    let completed = 0;
    try {
      for (const service of services) {
        if (createdServiceIds.includes(String(service.id))) continue;
        await api.createMyStylistAppointment(user.accessToken, {
          serviceId: Number(service.id), stylistId, appointmentDate: date, startTime: times[String(service.id)],
        });
        completed += 1;
        setCreatedServiceIds((current) => [...current, String(service.id)]);
      }
      onComplete?.();
    } catch (err) {
      setError(completed
        ? `${completed} more service booking(s) were saved. Retry to finish the remaining services: ${err.message}`
        : err.message || 'Unable to save your appointment.');
    } finally { setSubmitting(false); }
  };

  const confirmDetails = (event) => {
    event.preventDefault();
    if (!stylistId || !services.length || services.some((item) => !times[String(item.id)])) {
      setError('Choose a stylist and an available time for every selected service.');
      return;
    }
    setError('');
    setStep('confirm');
  };

  const changeDate = (value) => {
    setDate(value);
    setSlotsByService({});
    setTimes({});
    setError('');
  };
  const changeStylist = (value) => {
    setStylistId(value);
    setSlotsByService({});
    setTimes({});
    setError('');
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm sm:p-6" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="member-checkout-title" className={`relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border shadow-2xl ${surface}`}>
        <button type="button" onClick={onClose} aria-label="Close checkout" className={`absolute right-4 top-4 z-10 rounded-full p-2 ${muted}`}><X className="h-5 w-5" /></button>
        <div className="p-5 sm:p-7">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#C5A059]"><Scissors className="h-4 w-4" /> Member checkout</p>
          <h2 id="member-checkout-title" className="mt-1 text-2xl font-bold">{step === 'confirm' ? 'Review your booking' : 'Schedule your services'}</h2>
          <p className={`mt-1 text-xs ${muted}`}>Your selected services are included below. Choose a stylist, date, and an available time for each service.</p>

          {step === 'details' ? <form onSubmit={confirmDetails} className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="space-y-4">
              <section className={`rounded-xl border p-4 ${field}`}>
                <h3 className="mb-3 flex items-center gap-2 text-xs font-bold"><UserRound className="h-4 w-4 text-[#C5A059]" /> Booking information</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className={`text-[10px] font-semibold ${muted}`}>Name<input readOnly value={fullName} className={`mt-1 block min-h-11 w-full rounded-lg border px-3 text-xs ${field}`} /></label>
                  <label className={`text-[10px] font-semibold ${muted}`}>Email<input readOnly value={user?.email || ''} className={`mt-1 block min-h-11 w-full rounded-lg border px-3 text-xs ${field}`} /></label>
                </div>
              </section>
              <section className={`rounded-xl border p-4 ${field}`}>
                <h3 className="mb-3 flex items-center gap-2 text-xs font-bold"><CalendarDays className="h-4 w-4 text-[#C5A059]" /> Appointment details</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className={`text-[10px] font-semibold ${muted}`}>Date<input type="date" min={salonDate()} value={date} onChange={(event) => changeDate(event.target.value)} required className={`mt-1 block min-h-11 w-full rounded-lg border px-3 text-xs ${field}`} /></label>
                  <label className={`text-[10px] font-semibold ${muted}`}>Stylist<select value={stylistId} required disabled={loadingStylists} onChange={(event) => changeStylist(event.target.value)} className={`mt-1 block min-h-11 w-full rounded-lg border px-3 text-xs ${field}`}><option value="">{loadingStylists ? 'Loading stylists…' : 'Choose a stylist'}</option>{stylists.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                </div>
              </section>
              <section className="space-y-3">
                <h3 className="flex items-center gap-2 text-xs font-bold"><Clock3 className="h-4 w-4 text-[#C5A059]" /> Choose a time for each service</h3>
                {!stylistId ? <p className={`text-xs ${muted}`}>Select a stylist to load real availability.</p> : loadingSlots ? <p role="status" className={`text-xs ${muted}`}>Checking available times…</p> : services.map((service) => {
                  const serviceSlots = slotsByService[String(service.id)];
                  return <div key={service.id} className={`rounded-xl border p-3 ${field}`}>
                    <div className="mb-2 flex items-center justify-between gap-3"><p className="text-xs font-semibold">{service.title || service.name}</p><p className="text-xs font-bold text-[#C5A059]">{money(service.price)}</p></div>
                    {serviceSlots?.error ? <p role="alert" className="text-xs text-red-500">{serviceSlots.error}</p> : !serviceSlots?.length ? <p className={`text-xs ${muted}`}>No available times for this service and date.</p> : <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{serviceSlots.map((slot) => {
                      const start = toMinutes(slot.startTime);
                      const duration = Number(service.durationMinutes) || 0;
                      const overlaps = services.some((other) => {
                        const otherTime = times[String(other.id)];
                        if (!otherTime || String(other.id) === String(service.id)) return false;
                        const otherStart = toMinutes(otherTime);
                        return start < otherStart + (Number(other.durationMinutes) || 0) && start + duration > otherStart;
                      });
                      return <button key={slot.startTime} type="button" disabled={!slot.available || overlaps} onClick={() => setTimes((current) => ({ ...current, [String(service.id)]: slot.startTime }))} className={`min-h-11 rounded-lg border px-2 text-[11px] disabled:cursor-not-allowed disabled:opacity-35 ${times[String(service.id)] === slot.startTime ? 'border-[#4A3928] bg-[#4A3928] text-white' : `${field} hover:border-[#C5A059]`}`}>{slot.startTime}</button>;
                    })}</div>}
                  </div>;
                })}
              </section>
            </div>
            <aside className="space-y-3">
              <section className={`rounded-xl border p-4 ${field}`}><h3 className="text-xs font-bold">Selected services ({services.length})</h3><ul className="mt-3 space-y-3">{services.map((service) => <li key={service.id} className="flex justify-between gap-3 text-xs"><span>{service.title || service.name}</span><span className="shrink-0 font-semibold">{money(service.price)}</span></li>)}</ul><div className="mt-4 flex justify-between border-t border-inherit pt-3 text-sm font-bold"><span>Total</span><span>{money(total)}</span></div></section>
              {error && <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-xs text-red-600">{error}</p>}
              <button type="submit" disabled={loadingSlots || loadingStylists || !services.length || services.some((item) => !times[String(item.id)])} className="min-h-11 w-full rounded-full bg-[#4A3928] px-4 py-3 text-xs font-bold text-white hover:bg-[#725334] disabled:opacity-50">Review booking</button>
            </aside>
          </form> : <div className="mt-5 space-y-4">
            <div className={`rounded-xl border p-4 ${field}`}><p className="text-xs"><strong>Member:</strong> {fullName} · {user?.email}</p><p className="mt-2 text-xs"><strong>Stylist:</strong> {stylist?.name}</p><p className="mt-2 text-xs"><strong>Date:</strong> {date}</p><ul className="mt-4 space-y-2 border-t border-inherit pt-3">{services.map((service) => <li key={service.id} className="flex justify-between gap-3 text-xs"><span>{service.title || service.name} · {times[String(service.id)]}</span><span>{money(service.price)}</span></li>)}</ul><p className="mt-3 border-t border-inherit pt-3 text-right text-sm font-bold">Total {money(total)}</p></div>
            <p className={`text-xs ${muted}`}>This will create one appointment for each selected service using the times shown above.</p>
            {error && <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-xs text-red-600">{error}</p>}
            <div className="flex gap-2"><button type="button" onClick={() => setStep('details')} disabled={submitting} className={`min-h-11 flex-1 rounded-full border px-4 text-xs font-semibold ${field}`}>Back and edit</button><button type="button" onClick={submit} disabled={submitting} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#4A3928] px-4 text-xs font-bold text-white disabled:opacity-50">{submitting ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Saving…</> : <><CheckCircle2 className="h-4 w-4" /> Confirm booking</>}</button></div>
          </div>}
        </div>
      </section>
    </div>
  );
}
