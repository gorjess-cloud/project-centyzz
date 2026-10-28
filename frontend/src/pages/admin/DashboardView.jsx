import { useEffect, useState } from "react";
import {
  CalendarDays,
  Users,
  Wallet,
  Package,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Clock,
  RefreshCw,
  Scissors,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import AdminPageHeader from "../../components/workspace/AdminPageHeader";
import { adminWorkspaceRequest } from "../../api/admin-workspace";

const PH = "Asia/Manila";
const salonGreeting = (date = new Date()) => {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: PH,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(date),
  );
  return hour >= 5 && hour < 12
    ? "Good morning"
    : hour >= 12 && hour < 18
      ? "Good afternoon"
      : "Good evening";
};
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: PH,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const dateLabel = (day) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(day + "T00:00:00Z"));
const peso = (value) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    value || 0,
  );
const card = "rounded-2xl border border-[#E7DFD4] bg-white shadow-sm";
export default function DashboardView({
  currentUser,
  onNavigate,
  showHeaderActions = true,
}) {
  const [date, setDate] = useState(today),
    [result, setResult] = useState(null),
    [refresh, setRefresh] = useState(0),
    [clock, setClock] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 60000);
    return () => clearInterval(id);
  }, []);
  useEffect(()=>{const refresh=()=>setRefresh(n=>n+1);const timer=setInterval(refresh,60000);window.addEventListener('focus',refresh);window.addEventListener('admin-sales-updated',refresh);const channel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('centyzz-pos-events'):null;if(channel)channel.onmessage=refresh;return()=>{clearInterval(timer);window.removeEventListener('focus',refresh);window.removeEventListener('admin-sales-updated',refresh);channel?.close();};},[]);
  const token = currentUser?.accessToken;
  const requestKey = token + ":" + date + ":" + refresh;
  const ready = result?.key === requestKey;
  const data = ready ? result.data : null,
    error = ready ? result.error : "",
    loading = !ready;
  useEffect(() => {
    let active = true;
    adminWorkspaceRequest(token, "dashboard?date=" + date)
      .then((data) => {
        if (active) setResult({ key: requestKey, data, error: "" });
      })
      .catch((error) => {
        if (active)
          setResult({ key: requestKey, data: null, error: error.message });
      });
    return () => {
      active = false;
    };
  }, [token, date, requestKey]);
  const selected = new Date(date + "T00:00:00Z"),
    year = selected.getUTCFullYear(),
    month = selected.getUTCMonth();
  const start = new Date(Date.UTC(year, month, 1)),
    offset = (start.getUTCDay() + 6) % 7,
    days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const monthTitle = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(selected);
  const keyFor = (day) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const changeMonth = (step) =>
    setDate(
      new Date(Date.UTC(year, month + step, 1)).toISOString().slice(0, 10),
    );
  const go = (page) => onNavigate?.(page),
    stats = data?.stats;
  const metrics = [
    {
      title: "Daily net sales",
      value: stats ? peso(stats.revenue) : "—",
      hint: "Completed POS sales minus refunds",
      icon: Wallet,
      page: "reports",
    },
    {
      title: "Bookings",
      value: stats?.bookings ?? "—",
      hint: stats
        ? `${stats.pending} pending for this date`
        : "For the selected date",
      icon: CalendarDays,
      page: "schedule",
    },
    {
      title: "Current clients",
      value: stats?.clients ?? "—",
      hint: "Active client records",
      icon: Users,
      page: "clients",
    },
    {
      title: "Active staff",
      value: stats?.staff ?? "—",
      hint: "Current active staff profiles",
      icon: Users,
      page: "schedule",
    },
  ];
  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10 text-[#2A1E1B]">
      <AdminPageHeader
        showHeaderActions={showHeaderActions}
        title={`${salonGreeting(clock)}, ${currentUser?.firstName || "Admin"}.`}
        subtitle="Monitor salon performance, staff schedules and appointments."
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">{dateLabel(date)}</p>
        <button
          type="button"
          onClick={() => setRefresh((n) => n + 1)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-[#E7DFD4] bg-white px-3.5 py-2 text-xs font-bold disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh overview
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
        >
          {error}
        </p>
      )}
      {loading && (
        <p role="status" className="text-xs text-[#8A8174]">
          Loading the latest salon data…
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <button
            key={metric.title}
            type="button"
            onClick={() => go(metric.page)}
            className={`${card} p-5 text-left transition-colors hover:border-[#C5A059]`}
          >
            <div className="mb-5 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8174]">
                {metric.title}
              </span>
              <metric.icon size={17} className="text-[#B58D54]" />
            </div>
            <p className="text-2xl font-bold">{metric.value}</p>
            <p className="mt-1 text-[11px] text-[#8A8174]">{metric.hint}</p>
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(data?.categories ?? []).map((category, i) => {
          const Icon = [Scissors, Sparkles, Users][i % 3];
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => go("services")}
              className={`${card} flex items-center gap-3 p-5 text-left hover:border-[#C5A059]`}
            >
              <span className="rounded-xl bg-[#F8F5F0] p-3 text-[#8B5E3C]">
                <Icon size={21} />
              </span>
              <span>
                <strong className="block text-sm">{category.name}</strong>
                <span className="text-xs text-[#8A8174]">
                  {category.bookings} bookings for this date
                </span>
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => go("inventory")}
          className={`${card} flex items-center gap-3 p-5 text-left hover:border-[#C5A059]`}
        >
          <span className="rounded-xl bg-[#F8F5F0] p-3 text-[#8B5E3C]">
            <Package size={21} />
          </span>
          <span>
            <strong className="block text-sm">Inventory overview</strong>
            <span className="text-xs text-[#8A8174]">
              {data?.attention.lowStock ?? "—"} low-stock items
            </span>
          </span>
        </button>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <section className={`${card} p-5 sm:p-6`}>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold">
                  {date === today() ? "Today's appointments" : "Appointments"}
                </h2>
                <p className="mt-1 text-xs text-[#8A8174]">
                  Client bookings and assigned staff for {date}
                </p>
              </div>
              <button
                type="button"
                onClick={() => go("schedule")}
                className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[#8B5E3C]"
              >
                View schedule
                <ArrowUpRight size={14} />
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-[#E7DFD4]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F5F0] text-[10px] uppercase text-[#8A8174]">
                  <tr>
                    {["Time", "Client name", "Service", "Staff", "Status"].map(
                      (label) => (
                        <th key={label} className="px-4 py-3 font-bold">
                          {label}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEE7DC]">
                  {!data?.appointments.length && (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-8 text-center text-[#8A8174]"
                      >
                        {loading
                          ? "Loading appointments…"
                          : "No appointments for this date."}
                      </td>
                    </tr>
                  )}
                  {data?.appointments.map((item) => (
                    <tr key={item.id}>
                      <td className="whitespace-nowrap px-4 py-4 font-semibold">
                        {item.time.slice(0, 5)}
                      </td>
                      <td className="px-4 py-4 font-semibold">{item.client}</td>
                      <td className="px-4 py-4">{item.service}</td>
                      <td className="px-4 py-4 text-[#8A8174]">{item.staff}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${item.status === "CONFIRMED" ? "bg-emerald-50 text-emerald-700" : item.status === "PENDING" ? "bg-amber-50 text-amber-700" : "bg-[#F8F5F0] text-[#8A8174]"}`}
                        >
                          {item.status.replaceAll("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[10px] text-[#8A8174]">
              Showing up to five appointments. The full list is in Schedule.
            </p>
          </section>
          <section className={`${card} p-5 sm:p-6`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold">Staff shifts</h2>
              <Clock size={17} className="text-[#B58D54]" />
            </div>
            {!data?.shifts.length && (
              <p className="text-xs text-[#8A8174]">
                No staff shifts saved for this date.
              </p>
            )}
            <div className="space-y-2">
              {data?.shifts.map((shift) => (
                <div
                  key={shift.id}
                  className="flex justify-between gap-3 rounded-xl border border-[#E7DFD4] p-3 text-xs"
                >
                  <strong>{shift.name}</strong>
                  <span className="text-[#8A8174]">
                    {shift.start}–{shift.end}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
        <aside className="space-y-6 lg:col-span-4">
          <section className={`${card} p-5`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold">{monthTitle}</h2>
              <div className="flex gap-1">
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() => changeMonth(-1)}
                  className="rounded-lg p-1.5 hover:bg-[#F8F5F0]"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() => changeMonth(1)}
                  className="rounded-lg p-1.5 hover:bg-[#F8F5F0]"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <span key={day} className="py-2 font-bold text-[#8A8174]">
                  {day}
                </span>
              ))}
              {Array.from({ length: offset }, (_, i) => (
                <span key={"empty" + i} />
              ))}
              {Array.from({ length: days }, (_, i) => {
                const day = i + 1,
                  key = keyFor(day),
                  count = data?.calendar.find((row) => row.date === key)?.count;
                return (
                  <button
                    key={day}
                    type="button"
                    aria-label={`${dateLabel(key)}${count ? `, ${count} appointments` : ""}`}
                    aria-pressed={date === key}
                    onClick={() => setDate(key)}
                    className={`relative rounded-xl py-2.5 font-semibold ${date === key ? "bg-[#C5A059] text-white" : key === today() ? "bg-[#F1E7DA] text-[#785235]" : "hover:bg-[#F8F5F0]"}`}
                  >
                    {day}
                    {Boolean(count) && (
                      <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-current" />
                    )}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setDate(today())}
              className="mt-4 w-full rounded-xl border border-[#E7DFD4] py-2 text-xs font-bold text-[#8B5E3C] hover:bg-[#F8F5F0]"
            >
              Today
            </button>
          </section>
          <section className={`${card} p-5`}>
            <div className="mb-4 flex items-center gap-2">
              <AlertCircle size={16} className="text-[#B58D54]" />
              <h2 className="text-sm font-bold">Needs attention</h2>
            </div>
            <div className="space-y-3">
              {[
                {
                  label: "Pending appointments",
                  value: data?.attention.pending,
                  page: "schedule",
                },
                {
                  label: "Unassigned appointments",
                  value: data?.attention.unassigned,
                  page: "schedule",
                },
                ...(data?.inventoryAlertsEnabled === false
                  ? []
                  : [
                      {
                        label: "Low-stock items",
                        value: data?.attention.lowStock,
                        page: "inventory",
                      },
                    ]),
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => go(item.page)}
                  className="flex w-full items-center justify-between rounded-xl border border-[#E7DFD4] p-3 text-left text-xs hover:bg-[#F8F5F0]"
                >
                  <span>{item.label}</span>
                  <strong className="text-[#8B5E3C]">
                    {item.value ?? "—"}
                  </strong>
                </button>
              ))}
            </div>
            <p className="mt-4 text-[10px] text-[#8A8174]">
              {data
                ? "Updated " +
                  new Intl.DateTimeFormat("en-PH", {
                    timeZone: PH,
                    hour: "numeric",
                    minute: "2-digit",
                  }).format(new Date(data.updatedAt))
                : "Waiting for data"}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
