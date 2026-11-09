import { useEffect, useMemo, useState } from 'react';
import { Activity, CalendarDays, ChevronRight, Clock3, Package, RefreshCw, Receipt, Scissors, Settings, Sparkles } from 'lucide-react';
import { api } from '../../api/client.js';
import { Badge, Header, StatCard, card } from '../../components/staff/ui.jsx';

const salonDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date());
const prettyDate = (date) => new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Manila', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
}).format(date);
const timeLabel = (time) => {
  const [hours, minutes] = String(time || '').slice(0, 5).split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 'Time not set';
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
};

export default function StaffDashboardView({ currentUser, navigate }) {
  const [appointments, setAppointments] = useState([]);
  const [servicesCount, setServicesCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let current = true;
    Promise.all([api.getStaffAppointments(currentUser?.accessToken), api.getServices()])
      .then(([appointmentResult, serviceResult]) => {
        if (!current) return;
        setAppointments(appointmentResult?.data || []);
        const groups = Array.isArray(serviceResult) ? serviceResult : serviceResult?.data || [];
        setServicesCount(groups.reduce((total, group) => total + (group.services?.length || 0), 0));
      })
      .catch((err) => { if (current) setError(err.message || 'Unable to load staff dashboard data.'); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [currentUser?.accessToken, refreshKey]);

  const today = salonDate();
  const refresh = () => {
    setLoading(true);
    setError('');
    setRefreshKey((key) => key + 1);
  };
  const summary = useMemo(() => {
    const active = appointments.filter((item) => !['CANCELLED', 'NO_SHOW'].includes(String(item.status).toUpperCase()));
    const todayAppointments = active.filter((item) => String(item.appointmentDate).slice(0, 10) === today);
    const upcoming = active.filter((item) => String(item.appointmentDate).slice(0, 10) >= today)
      .sort((first, second) => `${first.appointmentDate} ${first.startTime}`.localeCompare(`${second.appointmentDate} ${second.startTime}`));
    return {
      today: todayAppointments.length,
      pending: active.filter((item) => String(item.status).toUpperCase() === 'PENDING').length,
      confirmed: active.filter((item) => String(item.status).toUpperCase() === 'CONFIRMED').length,
      upcoming,
    };
  }, [appointments, today]);

  const shortcuts = [
    { id: 'pos', title: 'Open POS', description: 'Start a sale and process payments', icon: Receipt, tone: 'bg-[#4A3928] text-white' },
    { id: 'schedule', title: 'View appointments', description: 'Review today’s schedule and check-ins', icon: CalendarDays, tone: 'bg-[#F2E7D5] text-[#725334]' },
    { id: 'inventory', title: 'Check inventory', description: 'Review current stock levels', icon: Package, tone: 'bg-[#F2E7D5] text-[#725334]' },
    { id: 'settings', title: 'Staff settings', description: 'Update your profile and preferences', icon: Settings, tone: 'bg-[#F2E7D5] text-[#725334]' },
  ];

  return (
    <div className="fade-in">
      <Header title={`Welcome${currentUser?.firstName ? `, ${currentUser.firstName}` : ''}`} subtitle={prettyDate(new Date())}>
        <button type="button" onClick={refresh} className="flex min-h-11 items-center gap-2 rounded-xl border border-[#E7DFD4] bg-[#FFFDF8] px-4 text-xs font-bold text-[#443523] transition hover:border-[#C5A059]">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </Header>

      {error && <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}

      <section aria-label="Quick launch shortcuts" className="mb-7">
        <div className="mb-3 flex items-center gap-2"><Sparkles size={16} className="text-[#C5A059]" /><h2 className="text-sm font-bold text-[#2A1E1B]">Quick launch</h2></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {shortcuts.map(({ id, title, description, icon: Icon, tone }) => (
            <button key={id} type="button" onClick={() => navigate?.(id)} className={`${card} group flex min-h-28 items-center gap-4 p-4 text-left transition hover:-translate-y-0.5 hover:border-[#C5A059] hover:shadow-md`}>
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tone}`}><Icon size={21} /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-[#2A1E1B]">{title}</span><span className="mt-1 block text-[11px] leading-relaxed text-[#8A8174]">{description}</span></span>
              <ChevronRight size={16} className="shrink-0 text-[#B29A75] transition group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      </section>

      <section aria-label="Operational metrics" className="mb-7">
        <div className="mb-3 flex items-center gap-2"><Activity size={16} className="text-[#C5A059]" /><h2 className="text-sm font-bold text-[#2A1E1B]">Operational overview</h2></div>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard icon={CalendarDays} label="Appointments today" value={loading ? '—' : summary.today} />
          <StatCard icon={Clock3} label="Awaiting confirmation" value={loading ? '—' : summary.pending} tone={summary.pending ? 'bad' : 'neutral'} />
          <StatCard icon={Scissors} label="Confirmed appointments" value={loading ? '—' : summary.confirmed} />
          <StatCard icon={Sparkles} label="Active services" value={loading ? '—' : servicesCount ?? '—'} />
        </div>
      </section>

      <section className={`${card} overflow-hidden`} aria-label="Upcoming appointments">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E7DFD4] px-4 py-4 sm:px-5">
          <div><h2 className="text-sm font-bold text-[#2A1E1B]">Upcoming appointments</h2><p className="mt-0.5 text-[11px] text-[#8A8174]">Your next scheduled client visits</p></div>
          <button type="button" onClick={() => navigate?.('schedule')} className="min-h-11 rounded-lg px-3 text-xs font-bold text-[#8B5E3C] transition hover:bg-[#F6F0E6]">Open schedule <span aria-hidden="true">→</span></button>
        </div>
        {loading ? <p role="status" className="p-5 text-xs text-[#8A8174]">Loading your schedule…</p>
          : summary.upcoming.length === 0 ? <p className="p-5 text-xs text-[#8A8174]">No upcoming appointments are assigned.</p>
          : <div className="divide-y divide-[#E7DFD4]">{summary.upcoming.slice(0, 5).map((appointment) => (
            <div key={appointment.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
              <div className="min-w-0"><p className="truncate text-xs font-bold text-[#2A1E1B]">{appointment.customerName || 'Client'} <span className="font-normal text-[#8A8174]">· {appointment.service?.name || 'Service'}</span></p><p className="mt-1 text-[11px] text-[#8A8174]">{String(appointment.appointmentDate).slice(0, 10)} · {timeLabel(appointment.startTime)}</p></div>
              <Badge tone={String(appointment.status).toUpperCase() === 'PENDING' ? 'gold' : 'ok'}>{appointment.status}</Badge>
            </div>
          ))}</div>}
      </section>
    </div>
  );
}
