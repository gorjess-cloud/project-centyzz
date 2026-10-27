import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, CreditCard, Trash2, CalendarClock, Tag, Check, Lock } from 'lucide-react';
import { Toast, useToast, Badge, EmptyState, ConfirmModal, peso, card, input } from '../../components/staff/ui';
import useModalScrollLock from '../../hooks/useModalScrollLock';
import { api } from '../../api/client';

const TAX = 0.0825;
const initials = (n = '') => n.split(' ').slice(0, 2).map((p) => p[0] || '').join('');

export default function StaffScheduleView({
  currentUser,
  appointments,
  appointmentsLoading,
  appointmentsError,
  onRefreshAppointments,
  onAppointmentUpdated,
}) {
  const [code, setCode] = useState('');
  const [appt, setAppt] = useState(null);
  const [promo, setPromo] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoValue, setPromoValue] = useState(0);
  const [promoType, setPromoType] = useState('PERCENTAGE');
  const [toast, say] = useToast();
  const [confirm, setConfirm] = useState(null);
  const [isConfirmCancelOpen, setIsConfirmCancelOpen] = useState(false);
  const [isAuthPinOpen, setIsAuthPinOpen] = useState(false);
  const [authPin, setAuthPin] = useState('');
  useModalScrollLock(Boolean(confirm?.title || isConfirmCancelOpen || isAuthPinOpen));

  const subtotal = appt ? appt.items.reduce((s, i) => s + i.price, 0) : 0;
  const discount = promoApplied ? Math.min(promoType.includes('PERCENT') ? subtotal * promoValue / 100 : promoValue, subtotal) : 0;
  const tax = (subtotal - discount) * TAX;
  const total = subtotal - discount + tax;
  const query = code.trim().toLowerCase();
  const serviceName = (appointment) =>
    appointment.service?.name || appointment.serviceName || 'Service not specified';
  const activeAppointments = appointments.filter((appointment) => !['CANCELLED', 'NO_SHOW'].includes(appointment.status));
  const matches = query ? activeAppointments.filter((appointment) =>
    [appointment.referenceCode, appointment.customerName, serviceName(appointment)]
      .some((value) => String(value ?? '').toLowerCase().includes(query)),
  ) : [];
  const visibleAppointments = query ? matches : activeAppointments;

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
      items: [{
        name: serviceName(found),
        note: found.notes || '',
        staff: found.stylistName || 'Unassigned',
        price: Number(found.service?.price || 0),
      }],
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
      onAppointmentUpdated({ id: appt.id, status });
      reset();
    } catch (error) { say(error.message); }
  };
  const pay = () => setConfirm({
    title: 'Confirm Appointment',
    message: 'Are you sure you want to mark this appointment as CONFIRMED? Note that payment must be verified separately.',
    action: () => changeAppointmentStatus('CONFIRMED', `Appointment confirmed; no payment was charged by this action`),
  });
  const noShow = () => setConfirm({ message: `Mark appointment #${appt.code} as a no-show?`, action: () => changeAppointmentStatus('NO_SHOW', `#${appt.code} marked as No Show`) });
  const confirmCancellationAuthorization = (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(authPin)) return;
    console.log('Cancellation authorized.');
    setIsAuthPinOpen(false);
    setAuthPin('');
  };
  const row = 'flex justify-between text-xs text-[#443523]';

  return (
    <div className="fade-in flex min-h-[calc(100vh-2.5rem)] flex-col lg:h-[calc(100vh-5rem)] lg:min-h-0 lg:overflow-hidden">
      <h1 className="shrink-0 text-2xl font-bold text-[#2A1E1B]">Appointments</h1>
      <p className="mb-6 mt-0.5 shrink-0 text-xs text-[#8A8174]">Scan client appointment receipt or look up guest</p>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
        <section className={`${card} flex min-h-0 flex-col p-4 lg:col-span-1`} aria-label="Assigned appointments">
          <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-[#2A1E1B]">{['ADMIN', 'SUPERADMIN'].includes(currentUser?.role) ? 'Salon Appointments' : 'My Assigned Appointments'}</h2>
            <div className="flex items-center gap-3"><span className="text-[11px] text-[#8A8174]">{appointments.length} appointments</span><button type="button" onClick={onRefreshAppointments} disabled={appointmentsLoading} className="text-xs font-bold text-[#8B5E3C] hover:underline disabled:cursor-wait disabled:opacity-60">Refresh</button></div>
          </div>
          <div className={`${card} mb-3 flex shrink-0 items-center gap-3 px-3 transition focus-within:border-[#C5A059] focus-within:ring-2 focus-within:ring-[#C5A059]/20`}>
            <Search size={16} className="shrink-0 text-[#8A8174]" />
            <input aria-label="Search appointments" value={code} onChange={(e) => { setCode(e.target.value); setAppt(null); setPromoApplied(false); setPromoValue(0); setPromo(''); }} onKeyDown={(e) => e.key === 'Enter' && matches.length === 1 && lookup(matches[0].referenceCode || matches[0].id)}
              placeholder="Type appointment/reference code here" className="min-w-0 flex-1 bg-transparent py-3.5 text-xs text-[#2A1E1B] outline-none" />
          </div>
          <button onClick={() => matches.length === 1 && lookup(matches[0].referenceCode || matches[0].id)} disabled={matches.length !== 1} className="mb-3 flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#4A3928] px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#2A1E1B] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"><Search size={14} /> Lookup &amp; Load</button>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {appointmentsLoading ? <p className="text-xs text-[#8A8174]">Loading appointments…</p>
              : appointmentsError ? <p role="alert" className="text-xs text-red-600">{appointmentsError}</p>
              : !appointments.length ? <p className="text-xs text-[#8A8174]">No appointments assigned yet.</p>
              : !visibleAppointments.length ? <p className="text-xs text-[#8A8174]">No appointments found.</p>
              : visibleAppointments.slice(0, 30).map((item) => {
                const status = String(item.status || '').toUpperCase();
                const statusColor = status === 'PENDING'
                  ? 'bg-orange-100 text-orange-800'
                  : status === 'CONFIRMED'
                    ? 'bg-green-100 text-green-800'
                    : ['CANCELLED', 'NO_SHOW'].includes(status)
                      ? 'bg-red-100 text-red-800'
                      : 'bg-stone-100 text-stone-700';
                return (
                  <button type="button" key={item.id} onClick={() => lookup(item.referenceCode || String(item.id))}
                    className={`flex w-full items-start justify-between gap-3 rounded-lg border p-3 text-left transition ${appt?.id === item.id ? 'border-[#C5A059] bg-[#F6F0E6] ring-1 ring-[#C5A059]/50' : 'border-[#E7DFD4] bg-white hover:bg-[#F6F0E6]'}`}>
                    <span className="flex min-w-0 flex-col">
                      <strong className="text-xs text-[#2A1E1B]">{item.customerName} · {serviceName(item)}</strong>
                      <span className="text-[11px] text-[#8A8174]">{item.appointmentDate} · {String(item.startTime).slice(0, 5)} · {item.stylistName || 'Unassigned'}</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${statusColor}`}>{status}</span>
                      <span className="text-right text-[10px] text-[#8A8174]">{item.paymentStatus === 'DEMO_PAID' ? 'Demo deposit' : item.paymentStatus === 'TEST_PAID' ? 'Test deposit' : 'No deposit recorded'}</span>
                    </span>
                  </button>
                );
              })}
          </div>
        </section>

        <section className="flex min-h-0 flex-col gap-4 lg:col-span-2">
          <div className={`${card} min-h-0 flex-1 overflow-y-auto p-4`}>
            {appt ? (
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
            ) : <EmptyState icon={CalendarClock} title={appointmentsLoading ? 'Loading appointments' : appointmentsError || 'Appointments will appear here'} hint="Search by reference code, guest, or service." />}
          </div>

          <div className={`${card} mt-auto grid shrink-0 items-center gap-5 p-5 md:grid-cols-2 xl:grid-cols-[1fr_1fr_auto]`}>
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
          <button disabled={!appt || appt.status === 'CONFIRMED'} onClick={pay} className="flex items-center justify-center gap-2 rounded-lg bg-[#4A3928] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#2A1E1B] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"><CreditCard size={14} />{appt?.status === 'CONFIRMED' ? ' Already Confirmed' : ' Confirm Appointment'}</button>
          <button disabled={!appt || appt.status !== 'CONFIRMED'} onClick={noShow} className={`flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${appt?.status === 'CONFIRMED' ? 'border border-red-200 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white active:scale-95' : 'border border-red-100 bg-red-50/50 text-red-300'}`}><Trash2 size={14} /> Mark as “No Show”</button>
          <button type="button" disabled={!appt} onClick={() => setIsConfirmCancelOpen(true)} className="flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-5 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={14} /> Cancel Appointment</button>
        </div>
      </div>
        </section>
      </div>
      <Toast msg={toast} />
      {confirm?.title ? createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirm(null); }}>
          <section role="alertdialog" aria-modal="true" aria-labelledby="appointment-confirmation-title" aria-describedby="appointment-confirmation-message" className="w-full max-w-md rounded-2xl border border-[#E7DFD4] bg-[#FFFDF8] p-6 font-sans text-[#2A1E1B] shadow-2xl">
            <h2 id="appointment-confirmation-title" className="text-xl font-bold">{confirm.title}</h2>
            <p id="appointment-confirmation-message" className="mt-2 text-sm text-[#756D60]">{confirm.message}</p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirm(null)} className="min-h-11 rounded-full border border-[#D7CDBD] px-5 text-sm font-semibold text-[#6D6253] hover:bg-[#F6F0E6]">Cancel</button>
              <button type="button" onClick={() => { confirm.action(); setConfirm(null); }} className="min-h-11 rounded-full bg-green-600 px-5 text-sm font-bold text-white hover:bg-green-700">Confirm</button>
            </div>
          </section>
        </div>,
        document.body,
      ) : confirm && <ConfirmModal message={confirm.message} danger={confirm.message.includes('no-show')} onCancel={() => setConfirm(null)} onConfirm={() => { confirm.action(); setConfirm(null); }} />}
      {isConfirmCancelOpen && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsConfirmCancelOpen(false); }}>
          <section role="alertdialog" aria-modal="true" aria-labelledby="cancel-appointment-title" aria-describedby="cancel-appointment-message" className="w-full max-w-sm rounded-3xl border border-[#E9E4D8] bg-white p-6 text-center shadow-2xl">
            <h2 id="cancel-appointment-title" className="text-base font-bold text-[#2A1E1B]">Cancel Appointment</h2>
            <p id="cancel-appointment-message" className="mt-2 text-xs text-[#8A8174]">Are you sure you want to cancel this appointment? This action cannot be undone.</p>
            <div className="mt-6 flex items-center gap-2">
              <button type="button" onClick={() => setIsConfirmCancelOpen(false)} className="flex-1 rounded-full bg-[#EFECE6] px-4 py-2.5 text-xs font-bold text-[#5C524B] transition-colors hover:bg-[#E4E0D8]">Go Back</button>
              <button type="button" onClick={() => { setIsConfirmCancelOpen(false); setAuthPin(''); setIsAuthPinOpen(true); }} className="flex-1 rounded-full bg-[#4A3928] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-[#3A2E2B] active:scale-95">Proceed</button>
            </div>
          </section>
        </div>,
        document.body,
      )}
      {isAuthPinOpen && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs" onMouseDown={(event) => { if (event.target === event.currentTarget) { setIsAuthPinOpen(false); setAuthPin(''); } }}>
          <section role="dialog" aria-modal="true" aria-labelledby="staff-authorization-title" className="w-full max-w-sm space-y-5 rounded-3xl border border-[#E9E4D8] bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#E9DCB3] bg-[#FFFDF3] text-[#B4833F] shadow-xs">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <h2 id="staff-authorization-title" className="text-base font-bold text-[#2A1E1B]">Staff Authorization</h2>
              <p className="mt-1 text-xs text-[#8A8174]">Enter your six-digit management PIN to confirm this action.</p>
            </div>
            <form onSubmit={confirmCancellationAuthorization} className="space-y-4">
              <input
                type="password"
                maxLength={6}
                autoFocus
                placeholder="••••••"
                aria-label="Six-digit management PIN"
                inputMode="numeric"
                pattern="[0-9]{6}"
                value={authPin}
                onChange={(event) => setAuthPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full rounded-full border border-[#E9E4D8] bg-[#FFFDF8] px-4 py-3 text-center text-lg font-bold tracking-[0.5em] outline-none focus:border-[#C5A059]"
              />
              <p className="text-[10px] text-[#8A8174]">Your management PIN is verified against your account, not a shared test code.</p>
              <div className="flex items-center gap-2 pt-2">
                <button type="button" onClick={() => { setIsAuthPinOpen(false); setAuthPin(''); }} className="flex-1 rounded-full bg-[#EFECE6] px-4 py-2.5 text-xs font-bold text-[#5C524B] transition-colors hover:bg-[#E4E0D8]">Cancel</button>
                <button type="submit" disabled={authPin.length !== 6} className="flex-1 rounded-full bg-[#4A3928] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-[#3A2E2B] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50">Confirm PIN</button>
              </div>
            </form>
          </section>
        </div>,
        document.body,
      )}
    </div>
  );
}
