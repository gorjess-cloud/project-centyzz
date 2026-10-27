import HeaderActions from "../../components/workspace/HeaderActions";
import { useEffect, useState } from "react";
import { api } from "../../api/client";
import {
  TrendingUp,
  Calendar as CalendarIcon,
  Users,
  Clock,
  CheckCircle2,
  Plus,
  Scissors,
  Sparkles,
  Edit3,
  Share2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Bell,
} from "lucide-react";

export default function DashboardView({ currentUser }) {
  const name = currentUser?.firstName || "Jesse";

  const categories = [
    {
      title: "Hair Styling",
      count: "12 Bookings",
      icon: Scissors,
      bg: "bg-[#EBF7E6]",
      text: "text-[#4A7C36]",
    },
    {
      title: "Nail & Spa",
      count: "8 Bookings",
      icon: Sparkles,
      bg: "bg-[#FFF8E7]",
      text: "text-[#B58D54]",
    },
    {
      title: "Lash & Brow",
      count: "5 Bookings",
      icon: Users,
      bg: "bg-[#F0F4FF]",
      text: "text-[#4B6BFB]",
    },
  ];

  const [appointments, setAppointments] = useState(
    currentUser?.accessToken
      ? []
      : [
          {
            id: "1",
            time: "08:30 AM",
            client: "Alicent Hightower",
            service: "Haircut and Hair color",
            stylist: "Peter Parker",
            status: "Confirmed",
          },
          {
            id: "2",
            time: "09:00 AM",
            client: "Jessica Palma",
            service: "Manicure and Pedicure",
            stylist: "Margaret Qualley",
            status: "Confirmed",
          },
          {
            id: "3",
            time: "09:00 AM",
            client: "Bernadette Lalata",
            service: "Brazilian Blowout",
            stylist: "Shaira Sollano",
            status: "In Progress",
          },
          {
            id: "4",
            time: "12:00 PM",
            client: "Michael Litang",
            service: "Full color",
            stylist: "Shaira Sollano",
            status: "Pending",
          },
        ],
  );
  const [appointmentsError, setAppointmentsError] = useState("");

  useEffect(() => {
    if (!currentUser?.accessToken) return undefined;
    let active = true;
    api
      .getStaffAppointments(currentUser.accessToken)
      .then((result) => {
        if (!Array.isArray(result?.data)) {
          throw new Error("The server returned an invalid appointments list.");
        }
        if (!active) return;
        setAppointments(
          result.data.map((appointment) => ({
            id: appointment.id,
            time: appointment.startTime || "Time TBD",
            client: appointment.customerName || "Guest",
            service:
              appointment.service?.name ||
              appointment.serviceName ||
              "Service not specified",
            stylist: appointment.stylistName || "Unassigned",
            status: appointment.status || "PENDING",
          })),
        );
        setAppointmentsError("");
      })
      .catch((error) => {
        if (active)
          setAppointmentsError(error.message || "Unable to load appointments.");
      });
    return () => {
      active = false;
    };
  }, [currentUser?.accessToken]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-4 mb-1">
            <span className="text-xs font-semibold text-[#8A8174] bg-[#F8F5F0] px-3 py-1 rounded-full border border-[#E7DFD4]">
              Salon Operational Workspace
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#2A1E1B] tracking-tight">
            Hi, {name}! 👋
          </h1>
          <h2 className="text-2xl font-bold text-[#2A1E1B] mt-0.5">
            What do you want to manage today?
          </h2>
          <p className="text-xs text-[#8A8174] mt-1">
            Monitor daily revenue, stylist assignments, and client appointments.
          </p>
        </div>

        {/* Top Header Navigation & User Actions */}
        <div className="flex items-center gap-3">
          <HeaderActions />
        </div>
      </div>

      {/* Grid Row 1: Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border-2 border-dashed border-[#E7DFD4] bg-[#FDFBF7] rounded-3xl p-5 flex flex-col items-center justify-center cursor-pointer hover:border-[#C5A059] transition-all group">
          <div className="p-3 bg-white rounded-2xl shadow-xs group-hover:bg-[#C5A059] group-hover:text-white transition-colors border border-[#E7DFD4]">
            <Plus size={20} className="text-[#C5A059] group-hover:text-white" />
          </div>
          <span className="text-xs font-bold text-[#2A1E1B] mt-2">
            New Appointment
          </span>
        </div>

        {categories.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-3xl p-5 border border-[#E7DFD4] shadow-xs flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-2xl ${cat.bg}`}>
                  <Icon size={22} className={cat.text} />
                </div>
                <span className="text-[10px] font-bold bg-[#F8F5F0] text-[#8A8174] px-2.5 py-1 rounded-full">
                  Today
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-base font-bold text-[#2A1E1B]">
                  {cat.title}
                </h3>
                <p className="text-xs text-[#8A8174] font-medium mt-0.5">
                  {cat.count}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Split Layout: Left Content Area & Right Sidebar Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8-Column Section */}
        <div className="lg:col-span-8 space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#B58D54] text-white p-5 rounded-3xl shadow-sm border border-[#9E7B3B] flex flex-col justify-between">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-white/90">
                  Daily Revenue
                </span>
                <span className="text-[10px] font-mono text-white/80">
                  Aug 17, 2026
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold">₱2,569</div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-100 mt-1 font-medium">
                  <TrendingUp size={12} />
                  <span>+12% vs yesterday</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#E7DFD4] shadow-xs flex flex-col justify-between">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Total Bookings
                </span>
                <div className="p-1.5 bg-[#F8F5F0] text-[#C5A059] rounded-lg border border-[#E7DFD4]">
                  <CalendarIcon size={14} />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#2A1E1B]">10</div>
                <p className="text-[10px] text-amber-700 mt-1 font-medium flex items-center gap-1">
                  <Clock size={10} /> 3 pending
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#E7DFD4] shadow-xs flex flex-col justify-between">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Client Count
                </span>
                <div className="p-1.5 bg-[#F8F5F0] text-[#C5A059] rounded-lg border border-[#E7DFD4]">
                  <Users size={14} />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#2A1E1B]">201</div>
                <p className="text-[10px] text-emerald-700 mt-1 font-medium">
                  +6 new this week
                </p>
              </div>
            </div>
          </div>

          {/* Schedule Table */}
          <div className="bg-white rounded-3xl border border-[#E7DFD4] shadow-sm overflow-hidden p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-[#2A1E1B]">
                    Today's Schedule
                  </h2>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>
                <p className="text-xs text-[#8A8174]">
                  Real-time queue & stylist assignments
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs text-[#8A8174]">
                <button className="flex items-center gap-1 hover:text-[#2A1E1B] font-semibold">
                  <Edit3 size={14} /> Edit
                </button>
                <button className="flex items-center gap-1 hover:text-[#2A1E1B] font-semibold">
                  <Share2 size={14} /> Share
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8F5F0] text-[10px] uppercase font-bold text-gray-500 tracking-wider border-b border-[#E7DFD4]">
                    <th className="p-3.5 pl-4 rounded-l-xl">Time</th>
                    <th className="p-3.5">Client Name</th>
                    <th className="p-3.5">Service</th>
                    <th className="p-3.5">Stylist</th>
                    <th className="p-3.5 pr-4 text-right rounded-r-xl">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7DFD4]/50 text-xs">
                  {appointmentsError && (
                    <tr>
                      <td
                        colSpan="5"
                        className="p-4 text-center text-red-600 bg-red-50"
                      >
                        {appointmentsError}
                      </td>
                    </tr>
                  )}
                  {appointments.map((apt) => (
                    <tr
                      key={apt.id}
                      className="hover:bg-[#FDFBF7] transition-colors"
                    >
                      <td className="p-3.5 pl-4 font-mono font-semibold text-gray-500">
                        {apt.time}
                      </td>
                      <td className="p-3.5 font-bold text-[#2A1E1B]">
                        {apt.client}
                      </td>
                      <td className="p-3.5 text-gray-600">
                        {apt.service?.name ||
                          apt.serviceName ||
                          apt.service ||
                          "Service not specified"}
                      </td>
                      <td className="p-3.5 text-gray-500">
                        Stylist :{" "}
                        <span className="text-[#2A1E1B] font-semibold">
                          {apt.stylist}
                        </span>
                      </td>
                      <td className="p-3.5 pr-4 text-right">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            apt.status === "In Progress"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : apt.status === "Confirmed"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-gray-100 text-gray-700 border border-gray-200"
                          }`}
                        >
                          {apt.status === "Confirmed" && (
                            <CheckCircle2 size={10} />
                          )}
                          {apt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 4-Column Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Mini Calendar Widget */}
          <div className="bg-white rounded-3xl border border-[#E7DFD4] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#2A1E1B]">
                August 2026
              </h3>
              <div className="flex items-center gap-1 text-[#8A8174]">
                <button className="p-1 hover:bg-[#F8F5F0] rounded-lg transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <button className="p-1 hover:bg-[#F8F5F0] rounded-lg transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-[#8A8174] mb-2">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-[#2A1E1B]">
              <span className="py-1.5 text-gray-300">14</span>
              <span className="py-1.5 text-gray-300">15</span>
              <span className="py-1.5 text-gray-300">16</span>
              <span className="py-1.5 bg-[#C5A059] text-white rounded-xl shadow-xs">
                17
              </span>
              <span className="py-1.5 hover:bg-[#F8F5F0] rounded-xl">18</span>
              <span className="py-1.5 hover:bg-[#F8F5F0] rounded-xl">19</span>
              <span className="py-1.5 hover:bg-[#F8F5F0] rounded-xl">20</span>
            </div>

            <div className="mt-5 pt-4 border-t border-[#E7DFD4] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#2A1E1B]">
                  10:30 AM – 12:00 PM
                </span>
                <MoreHorizontal size={14} className="text-gray-400" />
              </div>
              <div className="bg-[#F8F5F0] p-3 rounded-2xl border border-[#E7DFD4]">
                <p className="text-xs font-bold text-[#2A1E1B]">
                  Team Shift Sync
                </p>
                <p className="text-[10px] text-[#8A8174] mt-0.5">
                  10:30 AM – 11:30 AM • Stylist Briefing
                </p>
              </div>
            </div>
          </div>

          {/* Notifications Panel */}
          <div className="bg-white rounded-3xl border border-[#E7DFD4] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#E7DFD4] pb-3">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-[#C5A059]" />
                <h3 className="text-sm font-bold text-[#2A1E1B]">
                  Notifications
                </h3>
              </div>
              <button className="text-[10px] font-bold text-[#8A8174] hover:text-[#2A1E1B]">
                Clear
              </button>
            </div>

            <div className="bg-[#FDFBF7] p-3 rounded-2xl border border-[#E7DFD4] text-xs space-y-1">
              <p className="font-bold text-[#2A1E1B]">Upcoming Appointment</p>
              <p className="text-[11px] text-[#8A8174]">
                Michael Litang • Full Color
              </p>
              <p className="text-[10px] font-mono text-[#C5A059] font-bold">
                Today, 12:00 PM
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
