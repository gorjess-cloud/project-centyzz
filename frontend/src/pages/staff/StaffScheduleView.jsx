import { useEffect, useMemo, useState } from 'react';
import { Search, CreditCard, Trash2, CalendarClock, Tag, Check, CalendarDays, Clock3, RefreshCw } from 'lucide-react';
import { Toast, useToast, Badge, EmptyState, ConfirmModal, peso, card, input } from '../../components/staff/ui';
import { api } from '../../api/client';

const TAX = 0.0825;
const initials = (n = '') => n.split(' ').slice(0, 2).map((p) => p[0] || '').join('');
const salonClock = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return { date: `${values.year}-${values.month}-${values.day}`, minutes: Number(values.hour) * 60 + Number(values.minute) };
};
const isUpcoming = (appointment, now) => {
  const status = String(appointment.status || '').toUpperCase();
  if (['CANCELLED', 'COMPLETED', 'DONE', 'NO_SHOW', 'CHECKED_OUT'].includes(status)) return false;
  const date = String(appointment.appointmentDate || '').slice(0, 10);
  if (!date || date < now.date) return false;
  if (date > now.date) return true;
  const [hours, minutes] = String(appointment.endTime || appointment.startTime || '').slice(0, 5).split(':').map(Number);
  return Number.isFinite(hours) && Number.isFinite(minutes) && hours * 60 + minutes > now.minutes;
};

export default function StaffScheduleView({ currentUser }) {
  const [code, setCode] = useState('');
  const [appt, setAppt] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState('');
  const [appointmentsRefreshKey, setAppointmentsRefreshKey] = useState(0);
  const [scheduleFilter, setScheduleFilter] = useState('today');
  const [now, setNow] = useState(salonClock);
  const [promo, setPromo] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoValue, setPromoValue] = useState(0);
  const [promoType, setPromoType] = useState('PERCENTAGE');
  const [toast, say] = useToast();
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(salonClock()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let current = true;
    if (!currentUser?.accessToken) return undefined;
    Promise.resolve().then(() => {
      if (current) setAppointmentsLoading(true);
      return api.getStaffAppointments(currentUser.accessToken);
    })
      .then((result) => { if (current) { setAppointments(result.data ?? []); setAppointmentsError(''); } })
      .catch((error) => { if (current) setAppointmentsError(error.message); })
      .finally(() => { if (current) setAppointmentsLoading(false); });
    return () => { current = false; };
  }, [currentUser?.accessToken, appointmentsRefreshKey]);

  const activeAppointments = useMemo(() => appointments
    .filter((appointment) => isUpcoming(appointment, now))
    .sort((first, second) => `${first.appointmentDate} ${first.startTime}`.localeCompare(`${second.appointmentDate} ${second.startTime}`)), [appointments, now]);
  const todayAppointments = activeAppointments.filter((appointment) => String(appointment.appointmentDate).slice(0, 10) === now.date);
  const laterAppointments = activeAppointments.filter((appointment) => String(appointment.appointmentDate).slice(0, 10) > now.date);
  const scheduleAppointments = scheduleFilter === 'today' ? todayAppointments
    : scheduleFilter === 'upcoming' ? laterAppointments : activeAppointments;
  const visibleAppt = appt && activeAppointments.some((appointment) => String(appointment.id) === String(appt.id)) ? appt : null;
  const subtotal = visibleAppt ? visibleAppt.items.reduce((s, i) => s + i.price, 0) : 0;
  const discount = promoApplied ? Math.min(promoType.includes('PERCENT') ? subtotal * promoValue / 100 : promoValue, subtotal) : 0;
  const tax = (subtotal - discount) * TAX;
  const total = subtotal - discount + tax;
  const query = code.trim().toLowerCase();
  const loadingAppointments = Boolean(currentUser?.accessToken) && appointmentsLoading;
  const scheduleError = currentUser?.accessToken ? appointmentsError : 'Sign in with a staff account to load appointments.';
  const matches = query ? activeAppointments.filter((appointment) =>
    [appointment.referenceCode, appointment.id, appointment.customerName, appointment.customerEmail, appointment.service?.name, appointment.notes]
      .some((value) => String(value ?? '').toLowerCase().includes(query)),
  ) : [];

  const lookup = (value = code) => {
    const key = String(value).trim().toLowerCase();
    const found = activeAppointments.find((appointment) =>
      String(appointment.referenceCode || '').toLowerCase() === key || String(appointment.id) === key,
    );
    setPromoApplied(false);
    setPromoValue(0);
    setPromo('');
    setAppt(found ? {
      ...found,
      code: found.referenceCode || String(found.id),
      guest: found.customerName,
      items: found.service ? [{ name: found.service.name, note: found.notes || '', staff: found.stylistName || 'Unassigned', price: Number(found.service.price) }] : [],
    } : null);
  };
  const apply = async () => {
    try {
      const result = await api.validatePromo(promo);
      if (!result.valid || !result.promo) { say(result.message || 'Invalid code'); return; }
      const value = Number(result.promo.discountValue);
      if (subtotal < Number(result.promo.minPurchase || 0)) { say(`Minimum purchase is ${peso(Number(result.promo.minPurchase))}`); return; }
      setPromoValue(value);
      const type = String(result.promo.discountType).toUpperCase();
      setPromoType(type.includes('PERCENT') || type.includes('%') ? 'PERCENTAGE' : 'FIXED');
      setPromoApplied(true);
      say('Promotion applied');
    } catch (error) { say(error.message); }
  };
  const reset = () => { setAppt(null); setCode(''); setPromoApplied(false); setPromoValue(0); setPromo(''); };
  const changeAppointmentStatus = async (status, successMessage) => {
    try {
      await api.updateStaffAppointmentStatus(currentUser.accessToken, appt.id, status);
      say(successMessage);
      setAppointments((items) => items.map((item) => item.id === appt.id ? { ...item, status } : item));
      reset();
    } catch (error) { say(error.message); }
  };
  const pay = () => setConfirm({ message: `Confirm marking this appointment as CONFIRMED? (Payment must be verified separately.)`, action: () => changeAppointmentStatus('CONFIRMED', `Appointment confirmed; no payment was charged by this action`) });
  const noShow = () => setConfirm({ message: `Mark appointment #${appt.code} as a no-show?`, action: () => changeAppointmentStatus('NO_SHOW', `#${appt.code} marked as No Show`) });
  const row = 'flex justify-between text-xs text-[#443523]';

  return (
    <div className="fade-in flex min-h-[calc(100vh-2.5rem)] flex-col">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#C5A059]">Staff workspace</p>
          <h1 className="mt-1 text-2xl font-bold text-[#2A1E1B]">Schedule</h1>
          <p className="mt-1 text-xs text-[#8A8174]">Review active bookings and load a booking when you need its details.</p>
        </div>
        <button type="button" onClick={() => setAppointmentsRefreshKey((n) => n + 1)} className="flex min-h-11 items-center gap-2 rounded-xl border border-[#E7DFD4] bg-[#FFFDF8] px-4 text-xs font-bold text-[#443523] transition hover:border-[#C5A059]">
          <RefreshCw size={14} className={loadingAppointments ? 'animate-spin' : ''} /> Refresh schedule
        </button>
      </header>

      <section aria-label="Schedule overview" className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className={`${card} flex items-center gap-3 p-4`}><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F6F0E6] text-[#8B5E3C]"><CalendarDays size={18} /></span><div><p className="text-xl font-bold text-[#2A1E1B]">{loadingAppointments ? '—' : todayAppointments.length}</p><p className="text-[11px] text-[#8A8174]">Today</p></div></div>
        <div className={`${card} flex items-center gap-3 p-4`}><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F6F0E6] text-[#8B5E3C]"><CalendarClock size={18} /></span><div><p className="text-xl font-bold text-[#2A1E1B]">{loadingAppointments ? '—' : laterAppointments.length}</p><p className="text-[11px] text-[#8A8174]">Upcoming</p></div></div>
        <div className={`${card} flex items-center gap-3 p-4`}><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F6F0E6] text-[#8B5E3C]"><Clock3 size={18} /></span><div><p className="text-xl font-bold text-[#2A1E1B]">{loadingAppointments ? '—' : activeAppointments.filter((item) => String(item.status).toUpperCase() === 'PENDING').length}</p><p className="text-[11px] text-[#8A8174]">Awaiting confirmation</p></div></div>
      </section>

      <section className={`${card} mb-4 p-4`} aria-label="Assigned appointments">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[#2A1E1B]">{['ADMIN', 'SUPERADMIN'].includes(currentUser?.role) ? 'Salon appointments' : 'My assigned appointments'}</h2>
            <p className="mt-0.5 text-[11px] text-[#8A8174]">Completed and past bookings are hidden.</p>
          </div>
          <span className="text-[11px] text-[#8A8174]">{loadingAppointments ? 'Loading…' : `${activeAppointments.length} active`}</span>
        </div>
        <div className="mb-3 flex flex-wrap gap-2" role="tablist" aria-label="Filter appointments">
          {[
            ['today', `Today · ${todayAppointments.length}`],
            ['upcoming', `Upcoming · ${laterAppointments.length}`],
            ['all', `All active · ${activeAppointments.length}`],
          ].map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={scheduleFilter === id} onClick={() => setScheduleFilter(id)} className={`min-h-10 rounded-full px-4 text-[11px] font-bold transition ${scheduleFilter === id ? 'bg-[#4A3928] text-white' : 'border border-[#E7DFD4] bg-white text-[#63513B] hover:border-[#C5A059]'}`}>{label}</button>)}
        </div>
        {loadingAppointments ? <p className="text-xs text-[#8A8174]">Loading appointments…</p>
          : scheduleError ? <p role="alert" className="text-xs text-red-600">{scheduleError}</p>
          : !scheduleAppointments.length ? <p className="rounded-xl bg-[#F8F5F0] p-4 text-xs text-[#8A8174]">{activeAppointments.length ? 'No appointments in this view.' : 'No active upcoming appointments. Completed bookings are hidden.'}</p>
          : <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
            {scheduleAppointments.slice(0, 50).map((item) => (
              <button type="button" key={item.id} onClick={() => { setCode(item.referenceCode || String(item.id)); lookup(item.referenceCode || String(item.id)); }}
                className="flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E7DFD4] bg-white p-3 text-left transition hover:bg-[#F6F0E6]">
                <span><strong className="block text-xs text-[#2A1E1B]">{item.customerName} · {item.service?.name || 'Service'}</strong>
                  <span className="text-[11px] text-[#8A8174]">{item.appointmentDate} · {String(item.startTime).slice(0, 5)} · {item.stylistName || 'Unassigned'}</span></span>
                <span className="text-[10px] text-[#8B5E3C]">{item.status} · {item.paymentStatus === 'DEMO_PAID' ? 'Demo deposit' : item.paymentStatus === 'TEST_PAID' ? 'Test deposit' : 'No deposit recorded'}</span>
              </button>
            ))}
          </div>}
      </section>

      <div className="flex flex-col gap-3 md:flex-row">
        <div className={`${card} flex flex-1 items-center gap-3 px-4 transition focus-within:border-[#C5A059] focus-within:ring-2 focus-within:ring-[#C5A059]/20`}>
          <Search size={16} className="text-[#8A8174]" />
          <input aria-label="Search appointments" value={code} onChange={(e) => { setCode(e.target.value); setAppt(null); setPromoApplied(false); setPromoValue(0); setPromo(''); }} onKeyDown={(e) => e.key === 'Enter' && matches.length === 1 && lookup(matches[0].referenceCode || matches[0].id)}
            placeholder="Search active appointments by reference, client, or service" className="flex-1 bg-transparent py-3.5 text-xs text-[#2A1E1B] outline-none" />
        </div>
        <button onClick={() => matches.length === 1 && lookup(matches[0].referenceCode || matches[0].id)} disabled={matches.length !== 1} className="flex items-center justify-center gap-2 rounded-xl bg-[#4A3928] px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#2A1E1B] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"><Search size={14} /> Lookup &amp; Load</button>
      </div>

      <div className="flex-1 py-5">
        {query && !visibleAppt && <div className={`${card} mb-4 p-4`}>
          <p className="mb-3 text-xs font-bold text-[#443523]">{loadingAppointments ? 'Loading appointments…' : scheduleError || (matches.length ? `${matches.length} matching appointment${matches.length === 1 ? '' : 's'}` : 'No matching appointments')}</p>
          {matches.length > 0 && <ul className="space-y-2">{matches.map((match) => <li key={match.id}><button type="button" onClick={() => lookup(match.referenceCode || match.id)} className="flex w-full items-center justify-between rounded-lg border border-[#E7DFD4] bg-white px-3 py-2 text-left transition hover:bg-[#F6F0E6]"><span><span className="block text-xs font-bold text-[#2A1E1B]">{match.customerName}</span><span className="text-[11px] text-[#8A8174]">#{match.referenceCode || match.id} · {match.service?.name || "Service unavailable"}</span></span><span className="text-[11px] font-bold text-[#8B5E3C]">View</span></button></li>)}</ul>}
        </div>}
        {visibleAppt ? (
          <div className="fade-in">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#C5A059] bg-[#4A3928] text-xs font-bold text-[#C5A059]">{initials(appt.guest)}</span>
              <div>
                <p className="text-sm font-bold text-[#2A1E1B]">{appt.guest}</p>
                <p className="text-[11px] text-[#8A8174]">Assigned to {appt.stylistName || 'Unassigned'} · Deposit: {appt.paymentStatus === 'DEMO_PAID' ? 'Demo only' : appt.paymentStatus === 'TEST_PAID' ? 'PayMongo test' : 'Not recorded'}</p>
              </div>
              <Badge tone="gold">#{appt.code}</Badge>
            </div>
            <div className={`${card} overflow-x-auto`}>
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead><tr className="bg-[#F8F5F0] text-[10px] font-bold uppercase tracking-wider text-[#8A8174]"><th className="p-4 pl-6">Booked service</th><th className="p-4">Appointment</th><th className="p-4 text-right">Unit price</th><th className="p-4 pr-6 text-right">Total</th></tr></thead>
                <tbody className="divide-y divide-[#E7DFD4]">
                  {appt.items.map((i) => (
                    <tr key={i.name} className="transition hover:bg-[#FDFBF7]">
                      <td className="p-4 pl-6"><p className="font-bold text-[#2A1E1B]">{i.name}</p><p className="text-[#8A8174]">{i.note}</p></td>
                      <td className="p-4"><span className="block font-medium">{appt.appointmentDate}</span><span className="text-[11px] text-[#8A8174]">{String(appt.startTime).slice(0, 5)}–{String(appt.endTime).slice(0, 5)} · {appt.status}</span></td>
                      <td className="p-4 text-right font-mono">{peso(i.price)}</td>
                      <td className="p-4 pr-6 text-right font-mono font-bold text-[#2A1E1B]">{peso(i.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : !query ? (
          <div className={`${card} border-dashed`}>
            <EmptyState icon={CalendarClock} title={loadingAppointments ? 'Loading appointments' : scheduleError || 'Appointments will appear here'} hint="Search by reference code, guest, or service." />
          </div>
        ) : null}
      </div>

      {visibleAppt && <div className={`${card} grid items-center gap-5 p-5 md:grid-cols-2 xl:grid-cols-[1fr_1fr_auto]`}>
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase text-[#443523]">Promo Code</p>
          <div className="flex gap-2">
            <input aria-label="Promotion code" className={input} placeholder="Apply the promo code here" value={promo} onChange={(e) => { setPromo(e.target.value); setPromoApplied(false); setPromoValue(0); }} onKeyDown={(e) => e.key === 'Enter' && apply()} disabled={!visibleAppt} />
            <button disabled={!visibleAppt || !promo.trim() || promoApplied} onClick={apply} className="shrink-0 rounded-lg border border-[#E7DFD4] bg-white px-4 text-xs font-bold text-[#2A1E1B] transition hover:bg-[#F6F0E6] disabled:cursor-not-allowed disabled:opacity-40">Apply Code</button>
          </div>
          {promoApplied && <p className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600"><Check size={12} /> Promotion applied</p>}
        </div>
        <div className="space-y-1.5">
          <div className={row}><span>Subtotal</span><span className="font-mono">{peso(subtotal)}</span></div>
          {promoApplied && <div className={`${row} text-emerald-600`}><span className="flex items-center gap-1"><Tag size={11} /> Discount</span><span className="font-mono">-{peso(discount)}</span></div>}
          <div className={row}><span>Service Tax (8.25%)</span><span className="font-mono">{peso(tax)}</span></div>
          <div className="flex items-center justify-between border-t border-[#E7DFD4] pt-2 text-sm font-bold text-[#2A1E1B]"><span>Total Due</span><span className="font-mono text-xl text-[#8B5E3C]">{peso(total)}</span></div>
        </div>
        <div className="flex flex-col gap-2 md:col-span-2 md:flex-row xl:col-span-1 xl:flex-col">
          <button disabled={!visibleAppt} onClick={pay} className="flex items-center justify-center gap-2 rounded-lg bg-[#4A3928] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#2A1E1B] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"><CreditCard size={14} /> Confirm Appointment</button>
          <button disabled={!visibleAppt} onClick={noShow} className="flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-5 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-500 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={14} /> Mark as “No Show”</button>
        </div>
      </div>}
      <Toast msg={toast} />
      {confirm && <ConfirmModal message={confirm.message} danger={confirm.message.includes('no-show')} onCancel={() => setConfirm(null)} onConfirm={() => { confirm.action(); setConfirm(null); }} />}
    </div>
  );
}
