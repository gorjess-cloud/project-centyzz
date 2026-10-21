import { 
  Bell, 
  Search, 
  Moon, 
  TrendingUp, 
  Calendar, 
  Users, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';

export default function DashboardView({ currentUser }) {
  const today = new Date();
  const name = currentUser?.firstName || "Millicent";

  const appointments = [
    { id: '1', time: '08:30 AM', client: 'Alicent Hightower', service: 'Haircut and Hair color', stylist: 'Peter Parker', status: 'Confirmed' },
    { id: '2', time: '09:00 AM', client: 'Jessica Palma', service: 'Manicure and Pedicure', stylist: 'Margaret Qualley', status: 'Confirmed' },
    { id: '3', time: '09:00 AM', client: 'Bernadette Lalata', service: 'Brazilian Blowout', stylist: 'Shaira Sollano', status: 'In Progress' },
    { id: '4', time: '12:00 PM', client: 'Michael Litang', service: 'Full color', stylist: 'Shaira Sollano', status: 'Pending' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header — Matched strictly with User Management header typography */}
      <header className="mb-6 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-[#2A1E1B] truncate">
            Good{" "}
            {today.getHours() < 12
              ? "Morning"
              : today.getHours() < 18
                ? "Afternoon"
                : "Evening"}
            , {name}!
          </h1>
          <p className="mt-0.5 text-xs text-[#8A8174] truncate">
            Today is{" "}
            {today.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button className="p-2.5 rounded-full border border-[#E7DFD4] bg-white text-[#2A1E1B] hover:bg-[#F6F0E6] transition-colors">
            <Moon size={16} />
          </button>
          <button className="p-2.5 rounded-full border border-[#E7DFD4] bg-white text-[#2A1E1B] hover:bg-[#F6F0E6] transition-colors">
            <Search size={16} />
          </button>
          <button className="relative p-2.5 rounded-full border border-[#E7DFD4] bg-white text-[#2A1E1B] hover:bg-[#F6F0E6] transition-colors">
            <Bell size={16} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#C5A059] rounded-full ring-2 ring-white"></span>
          </button>
        </div>
      </header>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: Daily Revenue */}
        <div className="bg-[#B58D54] text-white p-6 rounded-2xl shadow-sm border border-[#9E7B3B] flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm bg-black/20 px-2 py-0.5 rounded-md">₱</span>
              <span className="text-xs font-bold uppercase tracking-wider text-white/90">Daily Revenue</span>
            </div>
            <span className="text-[10px] text-white/80 font-mono">August 17, 2026</span>
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight">₱2,569</div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-100 mt-1 font-medium">
              <TrendingUp size={12} />
              <span>+12% vs yesterday</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Bookings */}
        <div className="bg-[#F8F5F0] p-6 rounded-2xl border border-[#E7DFD4] shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white text-[#C5A059] rounded-lg border border-[#E7DFD4]">
                <Calendar size={16} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Total Bookings</span>
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#2A1E1B]">10</div>
            <p className="text-[11px] text-amber-700 mt-1 font-medium flex items-center gap-1">
              <Clock size={12} /> 3 pending confirmations
            </p>
          </div>
        </div>

        {/* Card 3: Client Count */}
        <div className="bg-[#F8F5F0] p-6 rounded-2xl border border-[#E7DFD4] shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white text-[#C5A059] rounded-lg border border-[#E7DFD4]">
                <Users size={16} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Client Count</span>
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#2A1E1B]">201</div>
            <p className="text-[11px] text-emerald-700 mt-1 font-medium">
              +6 new this week
            </p>
          </div>
        </div>

      </div>

      {/* Today's Schedule Table */}
      <div className="bg-white rounded-2xl border border-[#E7DFD4] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#E7DFD4] flex items-center justify-between bg-[#FDFBF7]">
          <div>
            <h2 className="text-base font-bold text-[#2A1E1B]">Today's schedule</h2>
            <p className="text-xs text-[#8A8174]">Stylist assignments and appointment queue</p>
          </div>
          <span className="text-xs text-gray-400 font-mono">August 17, 2026</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8F5F0] text-[10px] uppercase font-bold text-gray-500 tracking-wider border-b border-[#E7DFD4]">
                <th className="p-4 pl-6">Time</th>
                <th className="p-4">Client Name</th>
                <th className="p-4">Service</th>
                <th className="p-4">Stylist</th>
                <th className="p-4 pr-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7DFD4]/60 text-xs">
              {appointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-[#FDFBF7] transition-colors">
                  <td className="p-4 pl-6 font-mono font-semibold text-gray-500">{apt.time}</td>
                  <td className="p-4 font-bold text-[#2A1E1B]">{apt.client}</td>
                  <td className="p-4 text-gray-600">{apt.service}</td>
                  <td className="p-4 text-gray-500">Stylist : <span className="text-[#2A1E1B] font-semibold">{apt.stylist}</span></td>
                  <td className="p-4 pr-6 text-right">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      apt.status === 'In Progress' 
                        ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                        : apt.status === 'Confirmed'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}>
                      {apt.status === 'Confirmed' && <CheckCircle2 size={10} />}
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
  );
}