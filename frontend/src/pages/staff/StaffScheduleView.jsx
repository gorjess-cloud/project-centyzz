import { useState } from 'react';
import { Search, CreditCard, Trash2, CalendarClock, Tag, Check } from 'lucide-react';
import { Toast, useToast, Badge, EmptyState, ConfirmModal, peso, card, input } from '../../components/staff/ui';

const APPTS = {
  'GSS-9827419': { guest: 'Jessica Palma', items: [
    { name: 'Haircut', note: 'Includes wash, scalp massage, and hot towel treatment', staff: 'Karl Maverick Anonuevo', price: 99 },
    { name: 'Basic Color Hair', note: 'Premium color application & shaping', staff: 'Gian Carlo Dela Torre', price: 599 },
  ] },
};
const PROMOS = { NewMember2026: 0.2 };
const TAX = 0.0825;
const initials = (n) => n.split(' ').slice(0, 2).map((p) => p[0]).join('');
const DEMO_CODE = 'GSS-9827419';
const appointments = Object.entries(APPTS).map(([code, appointment]) => ({ code, ...appointment }));

export default function StaffScheduleView() {
  const [code, setCode] = useState('');
  const [appt, setAppt] = useState(null);
  const [promo, setPromo] = useState('');
  const [rate, setRate] = useState(0);
  const [toast, say] = useToast();
  const [confirm, setConfirm] = useState(null);

  const subtotal = appt ? appt.items.reduce((s, i) => s + i.price, 0) : 0;
  const discount = subtotal * rate;
  const tax = (subtotal - discount) * TAX;
  const total = subtotal - discount + tax;
  const query = code.trim().toLowerCase();
  const matches = query ? appointments.filter((appointment) =>
    [appointment.code, appointment.guest, ...appointment.items.flatMap((item) => [item.name, item.note, item.staff])]
      .some((value) => value.toLowerCase().includes(query)),
  ) : [];

  const lookup = (value = code) => {
    const key = value.trim().toUpperCase();
    const found = appointments.find((appointment) => appointment.code === key);
    setRate(0);
    setPromo('');
    setAppt(found || null);
  };
  const apply = () => {
    const r = PROMOS[promo.trim()];
    if (r) { setRate(r); say('Promotion applied'); } else say('Invalid code');
  };
  const reset = () => { setAppt(null); setCode(''); setRate(0); setPromo(''); };
  const pay = () => setConfirm({ message: `Confirm payment of ${peso(total)}?`, action: () => { say(`Payment of ${peso(total)} processed`); reset(); } });
  const noShow = () => setConfirm({ message: `Mark appointment #${appt.code} as a no-show?`, action: () => { say(`#${appt.code} marked as No Show`); reset(); } });
  const row = 'flex justify-between text-xs text-[#443523]';

  return (
    <div className="fade-in flex min-h-[calc(100vh-2.5rem)] flex-col">
      <h1 className="text-2xl font-bold text-[#2A1E1B]">Appointments</h1>
      <p className="mb-6 mt-0.5 text-xs text-[#8A8174]">Scan client appointment receipt or look up guest</p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className={`${card} flex flex-1 items-center gap-3 px-4 transition focus-within:border-[#C5A059] focus-within:ring-2 focus-within:ring-[#C5A059]/20`}>
          <Search size={16} className="text-[#8A8174]" />
          <input aria-label="Search appointments" value={code} onChange={(e) => { setCode(e.target.value); setAppt(null); setRate(0); setPromo(''); }} onKeyDown={(e) => e.key === 'Enter' && matches.length === 1 && lookup(matches[0].code)}
            placeholder="Type appointment/reference code here" className="flex-1 bg-transparent py-3.5 text-xs text-[#2A1E1B] outline-none" />
        </div>
        <button onClick={() => matches.length === 1 && lookup(matches[0].code)} disabled={matches.length !== 1} className="flex items-center justify-center gap-2 rounded-xl bg-[#4A3928] px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#2A1E1B] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"><Search size={14} /> Lookup &amp; Load</button>
      </div>

      <div className="flex-1 py-5">
        {query && !appt && <div className={`${card} mb-4 p-4`}>
          <p className="mb-3 text-xs font-bold text-[#443523]">{matches.length ? `${matches.length} matching appointment${matches.length === 1 ? '' : 's'}` : 'No matching appointments'}</p>
          {matches.length ? <ul className="space-y-2">{matches.map((match) => <li key={match.code}><button type="button" onClick={() => lookup(match.code)} className="flex w-full items-center justify-between rounded-lg border border-[#E7DFD4] bg-white px-3 py-2 text-left transition hover:bg-[#F6F0E6]"><span><span className="block text-xs font-bold text-[#2A1E1B]">{match.guest}</span><span className="text-[11px] text-[#8A8174]">#{match.code} · {match.items.map((item) => item.name).join(', ')}</span></span><span className="text-[11px] font-bold text-[#8B5E3C]">View</span></button></li>)}</ul> : <p className="text-[11px] text-[#8A8174]">Try the demo appointment code {DEMO_CODE}, guest name Jessica Palma, or service Haircut.</p>}
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
                <thead><tr className="bg-[#F8F5F0] text-[10px] font-bold uppercase tracking-wider text-[#8A8174]"><th className="p-4 pl-6">Booked service</th><th className="p-4">Staff assigned</th><th className="p-4 text-right">Unit price</th><th className="p-4 pr-6 text-right">Total</th></tr></thead>
                <tbody className="divide-y divide-[#E7DFD4]">
                  {appt.items.map((i) => (
                    <tr key={i.name} className="transition hover:bg-[#FDFBF7]">
                      <td className="p-4 pl-6"><p className="font-bold text-[#2A1E1B]">{i.name}</p><p className="text-[#8A8174]">{i.note}</p></td>
                      <td className="p-4"><span className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#4A3928] text-[9px] font-bold text-[#C5A059]">{initials(i.staff)}</span>{i.staff}</span></td>
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
            <EmptyState icon={CalendarClock} title="Appointment/s will appear here" hint="Search by code, guest, service, or assigned staff.">
              <button onClick={() => { setCode(DEMO_CODE); lookup(DEMO_CODE); }} className="mt-1 rounded-full border border-[#E7DFD4] bg-white px-3 py-1.5 text-[11px] font-bold text-[#8B5E3C] transition hover:bg-[#F6F0E6]">Try {DEMO_CODE}</button>
            </EmptyState>
          </div>
        ) : null}
      </div>

      <div className={`${card} grid items-center gap-5 p-5 md:grid-cols-2 xl:grid-cols-[1fr_1fr_auto]`}>
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase text-[#443523]">Apply promotion / member ID</p>
          <div className="flex gap-2">
            <input aria-label="Promotion code" className={input} placeholder="MEMB.." value={promo} onChange={(e) => setPromo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && apply()} disabled={!appt || rate > 0} />
            <button disabled={!appt || !promo.trim() || rate > 0} onClick={apply} className="shrink-0 rounded-lg border border-[#E7DFD4] bg-white px-4 text-xs font-bold text-[#2A1E1B] transition hover:bg-[#F6F0E6] disabled:cursor-not-allowed disabled:opacity-40">Apply Code</button>
          </div>
          {rate > 0 && <p className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600"><Check size={12} /> {Math.round(rate * 100)}% promotion applied</p>}
        </div>
        <div className="space-y-1.5">
          <div className={row}><span>Subtotal</span><span className="font-mono">{peso(subtotal)}</span></div>
          {rate > 0 && <div className={`${row} text-emerald-600`}><span className="flex items-center gap-1"><Tag size={11} /> Discount ({Math.round(rate * 100)}%)</span><span className="font-mono">-{peso(discount)}</span></div>}
          <div className={row}><span>Service Tax (8.25%)</span><span className="font-mono">{peso(tax)}</span></div>
          <div className="flex items-center justify-between border-t border-[#E7DFD4] pt-2 text-sm font-bold text-[#2A1E1B]"><span>Total Due</span><span className="font-mono text-xl text-[#8B5E3C]">{peso(total)}</span></div>
        </div>
        <div className="flex flex-col gap-2">
          <button disabled={!appt} onClick={pay} className="flex items-center justify-center gap-2 rounded-lg bg-[#4A3928] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#2A1E1B] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"><CreditCard size={14} /> Process Payment ({peso(total)})</button>
          <button disabled={!appt} onClick={noShow} className="flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-5 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-500 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={14} /> Mark as “No Show”</button>
        </div>
      </div>
      <Toast msg={toast} />
      {confirm && <ConfirmModal message={confirm.message} danger={confirm.message.includes('no-show')} onCancel={() => setConfirm(null)} onConfirm={() => { confirm.action(); setConfirm(null); }} />}
    </div>
  );
}
