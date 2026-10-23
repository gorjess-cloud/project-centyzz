import { useEffect, useState } from 'react';
import { Search, CreditCard, Trash2, CalendarClock, Tag, Check } from 'lucide-react';
import { Toast, useToast, Badge, EmptyState, ConfirmModal, peso, card, input } from '../../components/staff/ui';
import { api } from '../../api/client';

const TAX = 0.0825;
const initials = (n = '') => n.split(' ').slice(0, 2).map((p) => p[0] || '').join('');

export default function StaffScheduleView({ currentUser }) {
  const [code, setCode] = useState('');
  const [appt, setAppt] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState('');
  const [promo, setPromo] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoValue, setPromoValue] = useState(0);
  const [promoType, setPromoType] = useState('PERCENTAGE');
  const [toast, say] = useToast();
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    let current = true;
    if (!currentUser?.accessToken) {
      setAppointmentsError('Sign in with a staff account to load appointments.');
      setAppointmentsLoading(false);
      return undefined;
    }
    api.getStaffAppointments(currentUser.accessToken)
      .then((result) => { if (current) setAppointments(result.data ?? []); })
      .catch((error) => { if (current) setAppointmentsError(error.message); })
      .finally(() => { if (current) setAppointmentsLoading(false); });
    return () => { current = false; };
  }, [currentUser?.accessToken]);

  const subtotal = appt ? appt.items.reduce((s, i) => s + i.price, 0) : 0;
  const discount = promoApplied ? Math.min(promoType.includes('PERCENT') ? subtotal * promoValue / 100 : promoValue, subtotal) : 0;
  const tax = (subtotal - discount) * TAX;
  const total = subtotal - discount + tax;
  const query = code.trim().toLowerCase();
  const matches = query ? appointments.filter((appointment) =>
    [appointment.referenceCode, appointment.id, appointment.customerName, appointment.customerEmail, appointment.service?.name, appointment.notes]
      .some((value) => String(value ?? '').toLowerCase().includes(query)),
  ) : [];

  const lookup = (value = code) => {
    const key = String(value).trim().toLowerCase();
    const found = appointments.find((appointment) =>
      String(appointment.referenceCode || '').toLowerCase() === key || String(appointment.id) === key,
    );
    setPromoApplied(false);
    setPromoValue(0);
    setPromo('');
    setAppt(found ? {
      ...found,
      code: found.referenceCode || String(found.id),
      guest: found.customerName,
      items: found.service ? [{ name: found.service.name, note: found.notes || '', staff: '—', price: Number(found.service.price) }] : [],
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
  const pay = () => setConfirm({ message: `Confirm payment of ${peso(total)}?`, action: () => changeAppointmentStatus('CONFIRMED', `Payment of ${peso(total)} processed`) });
  const noShow = () => setConfirm({ message: `Mark appointment #${appt.code} as a no-show?`, action: () => changeAppointmentStatus('NO_SHOW', `#${appt.code} marked as No Show`) });
  const row = 'flex justify-between text-xs text-[#443523]';

  return (
    <div className="fade-in flex min-h-[calc(100vh-2.5rem)] flex-col">
      <h1 className="text-2xl font-bold text-[#2A1E1B]">Appointments</h1>
      <p className="mb-6 mt-0.5 text-xs text-[#8A8174]">Scan client appointment receipt or look up guest</p>

      <div className="flex flex-col gap-3 md:flex-row">
        <div className={`${card} flex flex-1 items-center gap-3 px-4 transition focus-within:border-[#C5A059] focus-within:ring-2 focus-within:ring-[#C5A059]/20`}>
          <Search size={16} className="text-[#8A8174]" />
          <input aria-label="Search appointments" value={code} onChange={(e) => { setCode(e.target.value); setAppt(null); setPromoApplied(false); setPromoValue(0); setPromo(''); }} onKeyDown={(e) => e.key === 'Enter' && matches.length === 1 && lookup(matches[0].referenceCode || matches[0].id)}
            placeholder="Type appointment/reference code here" className="flex-1 bg-transparent py-3.5 text-xs text-[#2A1E1B] outline-none" />
        </div>
        <button onClick={() => matches.length === 1 && lookup(matches[0].referenceCode || matches[0].id)} disabled={matches.length !== 1} className="flex items-center justify-center gap-2 rounded-xl bg-[#4A3928] px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#2A1E1B] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"><Search size={14} /> Lookup &amp; Load</button>
      </div>

      <div className="flex-1 py-5">
        {query && !appt && <div className={`${card} mb-4 p-4`}>
          <p className="mb-3 text-xs font-bold text-[#443523]">{appointmentsLoading ? 'Loading appointments…' : appointmentsError || (matches.length ? `${matches.length} matching appointment${matches.length === 1 ? '' : 's'}` : 'No matching appointments')}</p>
          {matches.length > 0 && <ul className="space-y-2">{matches.map((match) => <li key={match.id}><button type="button" onClick={() => lookup(match.referenceCode || match.id)} className="flex w-full items-center justify-between rounded-lg border border-[#E7DFD4] bg-white px-3 py-2 text-left transition hover:bg-[#F6F0E6]"><span><span className="block text-xs font-bold text-[#2A1E1B]">{match.customerName}</span><span className="text-[11px] text-[#8A8174]">#{match.referenceCode || match.id} · {match.service?.name || "Service unavailable"}</span></span><span className="text-[11px] font-bold text-[#8B5E3C]">View</span></button></li>)}</ul>}
        </div>}
        {appt ? (
          <div className="fade-in">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#C5A059] bg-[#4A3928] text-xs font-bold text-[#C5A059]">{initials(appt.guest)}</span>
              <div>
                <p className="text-sm font-bold text-[#2A1E1B]">{appt.guest}</p>
                <p className="text-[11px] text-[#8A8174]">Loaded appointment</p>
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
            <EmptyState icon={CalendarClock} title={appointmentsLoading ? 'Loading appointments' : appointmentsError || 'Appointments will appear here'} hint="Search by reference code, guest, or service." />
          </div>
        ) : null}
      </div>

      <div className={`${card} grid items-center gap-5 p-5 md:grid-cols-2 xl:grid-cols-[1fr_1fr_auto]`}>
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase text-[#443523]">Promo Code</p>
          <div className="flex gap-2">
            <input aria-label="Promotion code" className={input} placeholder="Apply the promo code here" value={promo} onChange={(e) => { setPromo(e.target.value); setPromoApplied(false); setPromoValue(0); }} onKeyDown={(e) => e.key === 'Enter' && apply()} disabled={!appt} />
            <button disabled={!appt || !promo.trim() || promoApplied} onClick={apply} className="shrink-0 rounded-lg border border-[#E7DFD4] bg-white px-4 text-xs font-bold text-[#2A1E1B] transition hover:bg-[#F6F0E6] disabled:cursor-not-allowed disabled:opacity-40">Apply Code</button>
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
          <button disabled={!appt} onClick={pay} className="flex items-center justify-center gap-2 rounded-lg bg-[#4A3928] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#2A1E1B] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"><CreditCard size={14} /> Process Payment ({peso(total)})</button>
          <button disabled={!appt} onClick={noShow} className="flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-5 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-500 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={14} /> Mark as “No Show”</button>
        </div>
      </div>
      <Toast msg={toast} />
      {confirm && <ConfirmModal message={confirm.message} danger={confirm.message.includes('no-show')} onCancel={() => setConfirm(null)} onConfirm={() => { confirm.action(); setConfirm(null); }} />}
    </div>
  );
}
