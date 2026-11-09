import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, CreditCard, Trash2, CalendarClock, Tag, Check, CalendarDays, Clock3, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Toast, useToast, Badge, EmptyState, ConfirmModal, peso, card, input } from '../../components/staff/ui';
import useModalScrollLock from '../../hooks/useModalScrollLock';
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
  const [appointmentView,setAppointmentView]=useState('active');
  const [appointmentPage,setAppointmentPage]=useState(1);
  const appointmentsPerPage=5;
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState('');
  const [appointmentsRefreshKey, setAppointmentsRefreshKey] = useState(0);
  const [now, setNow] = useState(salonClock);
  const [promo, setPromo] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoValue, setPromoValue] = useState(0);
  const [promoType, setPromoType] = useState('PERCENTAGE');
  const [toast, say] = useToast();
  const [confirm, setConfirm] = useState(null);
  useModalScrollLock(Boolean(confirm?.title));

  useEffect(() => {
    const timer = setInterval(() => setNow(salonClock()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let current = true;

    if (!currentUser?.accessToken) {
      setAppointments([]);
      setAppointmentsError('Sign in with a staff account to load appointments.');
      setAppointmentsLoading(false);
      return undefined;
    }

    setAppointmentsLoading(true);
    setAppointmentsError('');

    api.getStaffAppointments(currentUser.accessToken, appointmentView === 'archived')
      .then((result) => {
        if (current) {
          setAppointments(result.data ?? []);
          setAppointmentsError('');
        }
      })
      .catch((error) => {
        if (current) setAppointmentsError(error.message || 'Unable to load appointments.');
      })
      .finally(() => {
        if (current) setAppointmentsLoading(false);
      });

    return () => { current = false; };
  }, [currentUser?.accessToken, appointmentsRefreshKey, appointmentView]);

  const upcomingAppointments = useMemo(() => appointments
    .filter((appointment) => isUpcoming(appointment, now))
    .sort((first, second) => `${first.appointmentDate} ${first.startTime}`.localeCompare(`${second.appointmentDate} ${second.startTime}`)), [appointments, now]);
  const todayAppointments = upcomingAppointments.filter((appointment) => String(appointment.appointmentDate).slice(0, 10) === now.date);
  const laterAppointments = upcomingAppointments.filter((appointment) => String(appointment.appointmentDate).slice(0, 10) > now.date);
  const displayAppointments = appointmentView === 'archived'
    ? appointments
    : appointments.filter((appointment) => !['CANCELLED', 'NO_SHOW', 'COMPLETED', 'DONE', 'CHECKED_OUT'].includes(String(appointment.status || '').toUpperCase()));
  const loadingAppointments = Boolean(currentUser?.accessToken) && appointmentsLoading;
  const scheduleError = currentUser?.accessToken ? appointmentsError : 'Sign in with a staff account to load appointments.';
  const visibleAppt = appt && displayAppointments.some((appointment) => String(appointment.id) === String(appt.id)) ? appt : null;
  const subtotal = visibleAppt ? visibleAppt.items.reduce((sum, item) => sum + Number(item.price || 0), 0) : 0;
  const discount = promoApplied ? Math.min(promoType.includes('PERCENT') ? subtotal * promoValue / 100 : promoValue, subtotal) : 0;
  const tax = (subtotal - discount) * TAX;
  const total = subtotal - discount + tax;
  const query = code.trim().toLowerCase();