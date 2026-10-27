import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { api } from '../../api/client.js';

export function appointmentDateKey(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Manila'}).format(date);
}
const dayKey = (date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const timeLabel = (value) => {
  const [hour,minute] = String(value || '').split(':').map(Number);
  return Number.isInteger(hour) && Number.isInteger(minute) ? `${hour % 12 || 12}:${String(minute).padStart(2,'0')} ${hour >= 12 ? 'PM' : 'AM'}` : 'Time unavailable';
};

export default function StaffCalendarView({ currentUser }) {
  const today = appointmentDateKey(new Date());
  const [selected,setSelected] = useState(today);
  const [month,setMonth] = useState(() => { const [y,m] = today.split('-').map(Number); return new Date(y,m-1,1); });
  const [appointments,setAppointments] = useState([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  const [reload,setReload] = useState(0);
  useEffect(() => {
    let current = true;
    if (!currentUser?.accessToken) { setLoading(false); setError('Sign in with a Staff account to view your schedule.'); return undefined; }
    setLoading(true); setError('');
    api.getStaffAppointments(currentUser.accessToken).then(result => {
      if (!Array.isArray(result.data)) throw new Error('The schedule response was invalid.');
      if (current) setAppointments(result.data);
    }).catch(err => { if (current) { setAppointments([]); setError(err.message || 'Unable to load your schedule.'); } })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  },[currentUser?.accessToken,reload]);
  const grouped = useMemo(() => {
    const days = new Map();
    for (const item of appointments) { const key = appointmentDateKey(item.appointmentDate); if (!key) continue;
      if (!days.has(key)) days.set(key,[]); days.get(key).push(item); }
    for (const items of days.values()) items.sort((a,b) => String(a.startTime).localeCompare(String(b.startTime)));
    return days;
  },[appointments]);
  const first = new Date(month.getFullYear(),month.getMonth(),1);
  const count = new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
  const cells = Array.from({length:Math.ceil((first.getDay()+count)/7)*7},(_,index) => {
    const day = index-first.getDay()+1;
    return day < 1 || day > count ? null : new Date(month.getFullYear(),month.getMonth(),day);
  });
  const chosen = grouped.get(selected) || [];
  function changeMonth(delta) { const next = new Date(month.getFullYear(),month.getMonth()+delta,1); setMonth(next); setSelected(dayKey(next)); }
  return <div className="space-y-5 pb-6 text-[#443523]">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-xl font-bold">My schedule</h1><p className="mt-1 text-xs text-[#8A8174]">Appointments assigned to your Staff account.</p></div>
      <button type="button" disabled={loading} onClick={() => setReload(n=>n+1)} className="flex items-center gap-2 rounded-xl border border-[#E7DFD4] bg-white px-3 py-2 text-xs font-semibold disabled:opacity-50"><RefreshCw size={14}/>Refresh</button></header>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(260px,1fr)]">
      <section className="overflow-hidden rounded-2xl border border-[#E7DFD4] bg-white p-4 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold">{month.toLocaleDateString('en-US',{month:'long',year:'numeric'})}</h2>
          <div className="flex gap-1"><button aria-label="Previous month" onClick={() => changeMonth(-1)} className="rounded-lg border border-[#E7DFD4] p-2"><ChevronLeft size={16}/></button>
            <button onClick={() => { const [y,m]=today.split('-').map(Number); setMonth(new Date(y,m-1,1)); setSelected(today); }} className="rounded-lg border border-[#E7DFD4] px-3 text-xs">Today</button>
            <button aria-label="Next month" onClick={() => changeMonth(1)} className="rounded-lg border border-[#E7DFD4] p-2"><ChevronRight size={16}/></button></div></div>
        <div className="grid grid-cols-7 text-center text-[10px] font-bold uppercase text-[#8A8174]">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day=><span key={day} className="py-2">{day}</span>)}</div>
        <div className="grid grid-cols-7 gap-1">{cells.map((date,index)=>{
          if (!date) return <div key={`blank-${index}`} className="min-h-14 sm:min-h-20"/>;
          const key=dayKey(date),items=grouped.get(key)||[];
          return <button key={key} type="button" aria-pressed={selected===key} aria-label={`${date.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}, ${items.length} appointments`}
            onClick={() => setSelected(key)} className={`min-h-14 rounded-lg border p-1.5 text-left text-xs sm:min-h-20 sm:p-2 ${selected===key?'border-[#8B5E3C] bg-[#F3EADB]':'border-[#F0EAE0] hover:bg-[#FAF7F1]'}`}>
            <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full font-bold ${key===today?'bg-[#4A3928] text-white':''}`}>{date.getDate()}</span>
            {items.length>0&&<span className="mt-1 block text-[9px] font-semibold text-[#8B5E3C]">{items.length}<span className="hidden sm:inline"> booked</span></span>}
          </button>;
        })}</div>
      </section>
      <section className="rounded-2xl border border-[#E7DFD4] bg-white p-5"><h2 className="font-bold">{new Date(selected+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</h2>
        {loading?<p role="status" className="py-8 text-sm text-[#8A8174]">Loading appointments…</p>:!chosen.length?<div className="py-10 text-center text-[#8A8174]"><CalendarDays size={30} className="mx-auto mb-3"/><p className="text-sm">No assigned appointments for this day.</p></div>:
          <ul className="mt-4 space-y-3">{chosen.map(item=><li key={item.id} className="rounded-xl border border-[#E7DFD4] p-3"><p className="text-xs font-bold text-[#8B5E3C]">{timeLabel(item.startTime)} – {timeLabel(item.endTime)}</p>
            <h3 className="mt-2 text-sm font-bold">{item.customerName || 'Customer'}</h3><p className="mt-1 text-xs">{item.service?.name || 'Salon appointment'}</p>
            <p className="mt-2 text-[10px] text-[#8A8174]">{item.referenceCode || `Appointment #${item.id}`} · {String(item.status||'').replaceAll('_',' ')}</p></li>)}</ul>}
      </section>
    </div>
  </div>;
}
