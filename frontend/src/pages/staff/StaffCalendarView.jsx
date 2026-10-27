import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, UserRound } from 'lucide-react';
import { api } from '../../api/client';
import { Badge, EmptyState, card } from '../../components/staff/ui';

const dateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseAppointmentDate = (value) => {
  const [year, month, day] = String(value || '').slice(0, 10).split('-').map(Number);
  return year && month && day ? new Date(year, month - 1, day) : null;
};

const monthLabel = (date) => new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(date);
const longDate = (date) => new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(date);

const formatTime = (value) => {
  const [hours, minutes] = String(value || '').split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return String(value || 'Time TBD');
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(date);
};

function getMonthDays(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dates = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1)),
  ];
  const gridSize = Math.ceil(dates.length / 7) * 7;
  return [...dates, ...Array(gridSize - dates.length).fill(null)];
}

export default function StaffCalendarView({ currentUser }) {
  const [today] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const todayKey = dateKey(today);

  useEffect(() => {
    let active = true;
    if (!currentUser?.accessToken) return () => { active = false; };

    api.getStaffAppointments(currentUser.accessToken)
      .then((result) => { if (active) setAppointments(result.data ?? []); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [currentUser?.accessToken]);

  const appointmentDates = useMemo(() => new Set(
    appointments.map((appointment) => {
      const date = parseAppointmentDate(appointment.appointmentDate);
      return date ? dateKey(date) : '';
    }).filter(Boolean),
  ), [appointments]);

  const monthDays = useMemo(() => getMonthDays(visibleMonth), [visibleMonth]);
  const selectedAppointments = useMemo(() => appointments
    .filter((appointment) => {
      const appointmentDate = parseAppointmentDate(appointment.appointmentDate);
      return appointmentDate && dateKey(appointmentDate) === dateKey(selectedDate);
    })
    .sort((left, right) => String(left.startTime || '').localeCompare(String(right.startTime || ''))),
  [appointments, selectedDate]);

  const changeMonth = (amount) => {
    setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + amount, 1));
  };
  const selectDate = (date) => {
    setSelectedDate(date);
    setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  };

  return (
    <div className="fade-in flex min-h-[calc(100vh-2.5rem)] flex-col">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#A1885B]">STAFF WORKSPACE</p>
          <h1 className="text-2xl font-bold text-[#2A1E1B]">Schedule</h1>
          <p className="mt-0.5 text-xs text-[#8A8174]">Browse appointments by date</p>
        </div>
        <button type="button" onClick={() => selectDate(today)} className="rounded-xl border border-[#E7DFD4] bg-white px-4 py-2 text-xs font-bold text-[#443523] transition hover:bg-[#F6F0E6]">Today</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 w-full items-start">
        <div className="lg:col-span-7 w-full min-w-0">
          <section className={`${card} flex min-h-[700px] w-full min-w-0 flex-col rounded-3xl border border-gray-200 bg-white p-6 shadow-sm`} aria-label="Monthly schedule">
            <div className="mb-6 flex w-full items-center justify-between gap-2">
              <button type="button" aria-label="Previous month" onClick={() => changeMonth(-1)} className="grid h-10 w-10 place-items-center rounded-xl text-[#756D60] transition hover:bg-[#F6F0E6]"><ChevronLeft size={20} /></button>
              <h2 className="min-w-0 flex-1 text-center text-xl font-bold text-[#2A1E1B]">{monthLabel(visibleMonth)}</h2>
              <button type="button" aria-label="Next month" onClick={() => changeMonth(1)} className="grid h-10 w-10 place-items-center rounded-xl text-[#756D60] transition hover:bg-[#F6F0E6]"><ChevronRight size={20} /></button>
            </div>
            <div className="grid grid-cols-7 border-b border-[#E7DFD4] pb-2 text-center">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => <span key={day} className="text-[10px] font-bold uppercase tracking-wide text-[#A3998A]">{day.slice(0, 3)}</span>)}
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-7" style={{ gridTemplateRows: `repeat(${monthDays.length / 7}, minmax(120px, 1fr))` }}>
              {monthDays.map((date, index) => {
                if (!date) return <div key={`empty-${index}`} aria-hidden="true" className="border-b border-r border-gray-100 bg-white" />;
                const key = dateKey(date);
                const selected = key === dateKey(selectedDate);
                const hasAppointments = appointmentDates.has(key);
                return (
                  <button type="button" key={key} aria-label={`${longDate(date)}${hasAppointments ? ', appointments scheduled' : ''}`} aria-pressed={selected} onClick={() => selectDate(date)}
                    className={`group flex min-h-[120px] min-w-0 flex-col items-start border-b border-r border-gray-100 p-2 text-xs transition sm:p-3 ${selected ? 'bg-[#F6F0E6] ring-1 ring-inset ring-[#C5A059]' : 'hover:bg-[#FAF8F3]'}`}>
                    <span className={`grid h-7 w-7 place-items-center rounded-full ${selected ? 'bg-[#4A3928] font-bold text-white' : key === todayKey ? 'font-extrabold text-[#8B5E3C]' : ''}`}>{date.getDate()}</span>
                    {hasAppointments && <span aria-label="Appointments scheduled" className={`mt-2 h-2 w-2 rounded-full ${selected ? 'bg-[#8B5E3C]' : 'bg-[#5c4033]'}`} />}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="lg:col-span-5 w-full min-w-0 lg:sticky lg:top-5">
          <aside className={`${card} flex max-h-[80vh] min-h-64 flex-col overflow-y-auto rounded-3xl border border-gray-200 bg-white p-6 shadow-sm`}>
            <div className="mb-4 border-b border-[#E7DFD4] pb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#A1885B]">DAY VIEW</p>
              <h2 className="mt-1 text-base font-bold text-[#2A1E1B]">Appointments</h2>
              <p className="mt-1 text-xs text-[#8A8174]">{longDate(selectedDate)}</p>
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
              {!currentUser?.accessToken ? <p className="py-5 text-center text-xs text-[#8A8174]">Sign in with a staff account to load appointments.</p>
                : loading ? <p className="py-5 text-center text-xs text-[#8A8174]">Loading appointments…</p>
                : error ? <p role="alert" className="py-5 text-center text-xs text-red-600">{error}</p>
                  : !selectedAppointments.length ? <EmptyState icon={CalendarDays} title="Nothing scheduled" hint="No appointments scheduled for this day." />
                    : selectedAppointments.map((appointment) => (
                      <article key={appointment.id} className="rounded-xl border border-[#E7DFD4] bg-white p-3">
                        <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#8B5E3C]"><Clock3 size={14} />{formatTime(appointment.startTime)}{appointment.endTime ? ` – ${formatTime(appointment.endTime)}` : ''}</div>
                        <p className="text-sm font-bold text-[#2A1E1B]">{appointment.customerName || 'Guest'}</p>
                        <p className="mt-0.5 text-xs text-[#756D60]">{appointment.service?.name || 'Service unavailable'}</p>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                          <span className="flex items-center gap-1 text-[10px] text-[#8A8174]"><UserRound size={12} />{appointment.stylistName || 'Unassigned'}</span>
                          <Badge tone={appointment.status === 'CONFIRMED' ? 'ok' : appointment.status === 'CANCELLED' || appointment.status === 'NO_SHOW' ? 'bad' : 'gold'}>{appointment.status || 'PENDING'}</Badge>
                        </div>
                      </article>
                    ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
