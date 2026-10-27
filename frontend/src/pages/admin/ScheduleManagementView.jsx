import HeaderActions from '../../components/workspace/HeaderActions';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useState } from 'react';
import { 
  Search, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  X, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight,
  UserPlus
} from 'lucide-react';

export default function ScheduleManagementView({ showHeaderActions = true }) {
  const [toastMessage, setToastMessage] = useState('');

  // Main Tab State: 'active' vs 'archived'
  const [mainTab, setMainTab] = useState('active');

  // Sub-Tab Navigation: 'roster' | 'schedule' | 'appointments'
  const [activeSubTab, setActiveSubTab] = useState('roster');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Staff Dataset
  const [staffList, setStaffList] = useState([
    { 
      id: 'staff_1', 
      name: 'Karl Maverick Anonuevo', 
      email: 'anonuevo.karlmaverickbscs2024@gmail.com', 
      role: 'Stylist', 
      status: 'Active', 
      type: 'Full-time',
      isArchived: false,
      shifts: { Mon: 'Off', Tue: '12PM – 8PM', Wed: 'Off', Thu: '12PM – 8PM', Fri: '12PM – 8PM', Sat: '12PM – 8PM', Sun: '12PM – 8PM' }
    },
    { 
      id: 'staff_2', 
      name: 'Joshua Bunag', 
      email: 'bunag.joshuabscs2024@gmail.com', 
      role: 'Cashier', 
      status: 'Active', 
      type: 'Full-time',
      isArchived: false,
      shifts: { Mon: 'Off', Tue: 'Off', Wed: '9AM – 5PM', Thu: 'Off', Fri: '9AM – 5PM', Sat: '9AM – 5PM', Sun: 'Off' }
    },
    { 
      id: 'staff_3', 
      name: 'Gian Carlo Dela Torre', 
      email: 'delatorre.giancarlobscs2024@gmail.com', 
      role: 'Therapist', 
      status: 'Part Time', 
      type: 'Part-time',
      isArchived: false,
      shifts: { Mon: '9AM – 5PM', Tue: 'Off', Wed: 'Off', Thu: 'Off', Fri: 'Off', Sat: '9AM – 5PM', Sun: 'Off' }
    },
    { 
      id: 'staff_4', 
      name: 'Christian Angelo Javier', 
      email: 'javier.christianangelobscs2024@gmail.com', 
      role: 'Stylist', 
      status: 'On Leave', 
      type: 'Full-time',
      isArchived: false,
      shifts: { Mon: 'Off', Tue: 'Off', Wed: 'Off', Thu: '12PM – 8PM', Fri: 'Off', Sat: 'Off', Sun: 'Off' }
    },
    { 
      id: 'staff_5', 
      name: 'Former Staff Member', 
      email: 'former.staff@example.com', 
      role: 'Cashier', 
      status: 'Inactive', 
      type: 'Full-time',
      isArchived: true,
      shifts: { Mon: 'Off', Tue: 'Off', Wed: 'Off', Thu: 'Off', Fri: 'Off', Sat: 'Off', Sun: 'Off' }
    }
  ]);

  // Appointments Dataset
  const [appointments, setAppointments] = useState([
    { 
      id: 'A-78402', 
      clientName: 'Mary Lisondra', 
      clientEmail: 'mary.lisondra@example.com',
      clientPhone: '09PEROWHATIF',
      serviceName: 'Hair Color Basic', 
      duration: '90 mins', 
      price: '₱599.00', 
      stylist: 'Karl Maverick Anonuevo', 
      dateTime: 'Tuesday, August 18, 2026 at 10:00 AM',
      status: 'CONFIRMED',
      notes: ''
    },
    { 
      id: 'A-78403', 
      clientName: 'Janaryan Bebania', 
      clientEmail: 'janaryan@example.com',
      clientPhone: '09171234567',
      serviceName: 'Hair Color', 
      duration: '120 mins', 
      price: '₱1,200.00', 
      stylist: 'Gian Carlo Dela Torre', 
      dateTime: 'Wednesday, August 19, 2026 at 2:00 PM',
      status: 'CONFIRMED',
      notes: 'Customer requested hair wash before coloring.'
    },
    { 
      id: 'A-78404', 
      clientName: 'Louie Jein Banting', 
      clientEmail: 'louie@example.com',
      clientPhone: '09189876543',
      serviceName: 'Nails', 
      duration: '60 mins', 
      price: '₱450.00', 
      stylist: 'Joshua Bunag', 
      dateTime: 'Thursday, August 20, 2026 at 2:00 PM',
      status: 'CONFIRMED',
      notes: 'Prefers nude gel polish colors.'
    }
  ]);

  // Modals & Action Target States
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [isEditScheduleModalOpen, setIsEditScheduleModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [pendingVoidAppointment, setPendingVoidAppointment] = useState(null);
  const [archiveTargetStaff, setArchiveTargetStaff] = useState(null);
  const [deleteTargetStaff, setDeleteTargetStaff] = useState(null);

  // Form States
  const [newStaffForm, setNewStaffForm] = useState({
    name: '',
    email: '',
    role: 'Stylist',
    type: 'Full-time'
  });

  const [scheduleFormDays, setScheduleFormDays] = useState({
    Monday: { active: false, start: '09:00 AM', end: '05:00 PM', hours: 0 },
    Tuesday: { active: true, start: '12:00 PM', end: '08:00 PM', hours: 8 },
    Wednesday: { active: false, start: '09:00 AM', end: '05:00 PM', hours: 0 },
    Thursday: { active: true, start: '12:00 PM', end: '08:00 PM', hours: 8 },
    Friday: { active: true, start: '12:00 PM', end: '08:00 PM', hours: 8 },
    Saturday: { active: true, start: '12:00 PM', end: '08:00 PM', hours: 8 },
    Sunday: { active: true, start: '12:00 PM', end: '08:00 PM', hours: 8 },
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Filter Logic
  const filteredStaff = staffList.filter(s => {
    const matchesTab = mainTab === 'active' ? !s.isArchived : s.isArchived;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || s.role === roleFilter;

    return matchesTab && matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage) || 1;
  const paginatedStaff = filteredStaff.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Metric Summaries
  const totalEmployees = staffList.filter(s => !s.isArchived).length;
  const activeCount = staffList.filter(s => !s.isArchived && s.status === 'Active').length;
  const onLeaveCount = staffList.filter(s => !s.isArchived && s.status === 'On Leave').length;
  const partTimeCount = staffList.filter(s => !s.isArchived && s.status === 'Part Time').length;

  const totalWeeklyHours = Object.values(scheduleFormDays).reduce((acc, day) => acc + (day.active ? day.hours : 0), 0);

  const handleAddNewStaff = (e) => {
    e.preventDefault();
    if (!newStaffForm.name || !newStaffForm.email) return;

    const newStaff = {
      id: `staff_${Date.now()}`,
      name: newStaffForm.name,
      email: newStaffForm.email,
      role: newStaffForm.role,
      status: 'Active',
      type: newStaffForm.type,
      isArchived: false,
      shifts: { Mon: 'Off', Tue: '12PM – 8PM', Wed: 'Off', Thu: '12PM – 8PM', Fri: '12PM – 8PM', Sat: '12PM – 8PM', Sun: '12PM – 8PM' }
    };

    setStaffList([newStaff, ...staffList]);
    setIsAddStaffModalOpen(false);
    showToast(`Added ${newStaff.name} to Staff Roster`);
    setNewStaffForm({ name: '', email: '', role: 'Stylist', type: 'Full-time' });
  };

  const handleSaveWeeklySchedule = (e) => {
    e.preventDefault();
    setIsEditScheduleModalOpen(false);
    showToast('Updated weekly shift schedule for Karl Maverick Anonuevo');
  };

  const handleVoidAppointment = (appId) => {
    setAppointments(appointments.map(a => a.id === appId ? { ...a, status: 'VOIDED' } : a));
    setSelectedAppointment(null);
    showToast(`Appointment #${appId} has been voided`);
  };

  const renderRoleBadge = (role) => {
    const roleColors = {
      'Stylist': 'bg-[#F3E8FF] text-[#7E22CE] border border-purple-200',
      'Cashier': 'bg-[#E0F2FE] text-[#0369A1] border border-sky-200',
      'Therapist': 'bg-[#CCFBF1] text-[#0F766E] border border-teal-200'
    };
    return (
      <span className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${roleColors[role] || 'bg-gray-100 text-gray-700'}`}>
        {role}
      </span>
    );
  };

  const renderStatusBadge = (status) => {
    if (status === 'Active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> ACTIVE
        </span>
      );
    }
    if (status === 'Part Time') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span> PART TIME
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span> ON LEAVE
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8 text-[#2A1E1B] font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-[#3A342B] text-[#F5F1EA] px-4 py-3 rounded-xl shadow-xl border border-[#C5A059]/40 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-[#C5A059]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Outer Page Header - Clean standard matching Client and Inventory */}
      <header className="mb-6 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-[#2A1E1B] truncate">Staff & Schedule Management</h1>
          <p className="mt-0.5 text-xs text-[#8A8174] truncate">
            Manage employee rosters, weekly shifts, and client bookings
          </p>
        </div>

        {showHeaderActions && (<HeaderActions />)}
      </header>

      {/* Top Metric Cards (Placed directly above the main container) */}
      {mainTab === 'active' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl border border-[#E7DFD4] bg-white shadow-2xs space-y-1">
            <p className="text-[10px] uppercase font-bold text-[#8A8174] tracking-wider">TOTAL EMPLOYEE</p>
            <p className="text-2xl font-bold text-[#2A1E1B]">{totalEmployees}</p>
          </div>
          <div className="p-5 rounded-2xl border border-[#E7DFD4] bg-white shadow-2xs space-y-1">
            <p className="text-[10px] uppercase font-bold text-[#8A8174] tracking-wider">ACTIVE</p>
            <p className="text-2xl font-bold text-emerald-800">{activeCount}</p>
          </div>
          <div className="p-5 rounded-2xl border border-[#E7DFD4] bg-white shadow-2xs space-y-1">
            <p className="text-[10px] uppercase font-bold text-[#8A8174] tracking-wider">ON-LEAVE</p>
            <p className="text-2xl font-bold text-amber-800">{onLeaveCount}</p>
          </div>
          <div className="p-5 rounded-2xl border border-[#E7DFD4] bg-white shadow-2xs space-y-1">
            <p className="text-[10px] uppercase font-bold text-[#8A8174] tracking-wider">PART-TIME</p>
            <p className="text-2xl font-bold text-[#2A1E1B]">{partTimeCount}</p>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER SQUARE - Exactly matching Client and Inventory layout */}
      <div className="bg-white rounded-2xl border border-[#E7DFD4] shadow-sm p-6 sm:p-8 space-y-6">
        
        {/* Main Toolbar inside the square */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left Title & Active/Archived Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#2A1E1B]">Staff Roster</h2>
              <span className="bg-[#2A1E1B] text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                {filteredStaff.length}
              </span>
            </div>

            {/* Active Roster vs Archived Bin Toggle */}
            <div className="flex items-center bg-[#F8F5F0] p-1 rounded-xl border border-[#E7DFD4] ml-2">
              <button
                onClick={() => { setMainTab('active'); setCurrentPage(1); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mainTab === 'active' 
                    ? 'bg-[#2A1E1B] text-white shadow-xs' 
                    : 'text-[#8A8174] hover:text-[#2A1E1B]'
                }`}
              >
                Active Roster
              </button>
              <button
                onClick={() => { setMainTab('archived'); setCurrentPage(1); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mainTab === 'archived' 
                    ? 'bg-[#2A1E1B] text-white shadow-xs' 
                    : 'text-[#8A8174] hover:text-[#2A1E1B]'
                }`}
              >
                Archived Bin
              </button>
            </div>
          </div>

          {/* Right Inputs + ADD STAFF BUTTON INSIDE THE SQUARE */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A8174]" />
              <input
                type="text"
                placeholder="Search staff name or email..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E7DFD4] bg-[#FFFDF8] text-xs text-[#2A1E1B] placeholder-[#8A8174] outline-none focus:border-[#C5A059] transition-all font-medium"
              />
            </div>

            {/* Role Filter Dropdown */}
            {activeSubTab === 'roster' && (
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                className="bg-[#FFFDF8] border border-[#E7DFD4] text-[#2A1E1B] text-xs font-semibold px-3.5 py-2.5 rounded-xl outline-none cursor-pointer focus:border-[#C5A059]"
              >
                <option value="ALL">All Roles</option>
                <option value="Stylist">Stylist</option>
                <option value="Cashier">Cashier</option>
                <option value="Therapist">Therapist</option>
              </select>
            )}

            {/* ADD STAFF BUTTON - Placed inside main container box */}
            <button
              onClick={() => setIsAddStaffModalOpen(true)}
              className="flex items-center gap-2 bg-[#8B5E3C] hover:bg-[#724B2F] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 border border-[#C5A059]/40"
            >
              <Plus size={16} />
              <span>Add Staff</span>
            </button>
          </div>
        </div>

        {/* Sub-Tabs Row inside the card: Roster | Schedule | Appointments */}
        <div className="flex items-center gap-1 bg-[#F8F5F0] p-1 rounded-xl border border-[#E7DFD4] w-fit">
          <button
            onClick={() => setActiveSubTab('roster')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'roster' ? 'bg-[#2A1E1B] text-white shadow-xs' : 'text-[#8A8174] hover:text-[#2A1E1B]'
            }`}
          >
            Roster
          </button>
          <button
            onClick={() => setActiveSubTab('schedule')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'schedule' ? 'bg-[#2A1E1B] text-white shadow-xs' : 'text-[#8A8174] hover:text-[#2A1E1B]'
            }`}
          >
            Schedule
          </button>
          <button
            onClick={() => setActiveSubTab('appointments')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'appointments' ? 'bg-[#2A1E1B] text-white shadow-xs' : 'text-[#8A8174] hover:text-[#2A1E1B]'
            }`}
          >
            Appointments
          </button>
        </div>

        {/* ================= SUB-TAB 1: ROSTER ================= */}
        {activeSubTab === 'roster' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="overflow-x-auto rounded-xl border border-[#E7DFD4]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FFFDF8] text-[10px] uppercase font-bold text-[#8A8174] tracking-wider border-b border-[#E7DFD4]">
                    <th className="p-4 pl-6">EMPLOYEE</th>
                    <th className="p-4">ROLE</th>
                    <th className="p-4 text-center">STATUS</th>
                    <th className="p-4 pr-6 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7DFD4] text-xs font-sans">
                  {paginatedStaff.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-[#8A8174]">
                        {mainTab === 'active' ? 'No active staff members found.' : 'Archived staff bin is empty.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedStaff.map((staff) => (
                      <tr key={staff.id} className="hover:bg-[#FDFBF7] transition-colors">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#8B5E3C] text-white font-bold flex items-center justify-center text-xs shrink-0">
                              {staff.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-[#2A1E1B]">{staff.name}</p>
                              <p className="text-[11px] text-[#8A8174] mt-0.5">{staff.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">{renderRoleBadge(staff.role)}</td>
                        <td className="p-4 text-center">{renderStatusBadge(staff.status)}</td>
                        <td className="p-4 pr-6 text-center">
                          {mainTab === 'active' ? (
                            <button
                              onClick={() => setArchiveTargetStaff(staff)}
                              className="p-2 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                              title="Archive Staff Member"
                            >
                              <Trash2 size={16} />
                            </button>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setStaffList(staffList.map(s => s.id === staff.id ? { ...s, isArchived: false } : s));
                                  showToast(`Restored ${staff.name} to Active Roster`);
                                }}
                                className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center gap-1 font-bold text-[11px]"
                                title="Restore Staff Member"
                              >
                                <RotateCcw size={14} /> Restore
                              </button>
                              <button
                                onClick={() => setDeleteTargetStaff(staff)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                                title="Delete Permanently"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-[#8A8174] pt-1 gap-3">
              <span>Showing {paginatedStaff.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredStaff.length)} of {filteredStaff.length} items</span>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-[#E7DFD4] bg-[#FFFDF8] disabled:opacity-40 hover:bg-[#F8F5F0] transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="font-semibold px-2 text-[#2A1E1B]">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-[#E7DFD4] bg-[#FFFDF8] disabled:opacity-40 hover:bg-[#F8F5F0] transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ================= SUB-TAB 2: SCHEDULE ================= */}
        {activeSubTab === 'schedule' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#E7DFD4] pb-4">
              <div>
                <h3 className="text-base font-bold text-[#2A1E1B]">Weekly Shift Schedule</h3>
                <p className="text-xs text-[#8A8174]">Overview of staff availability across the week</p>
              </div>
              <button
                onClick={() => setIsEditScheduleModalOpen(true)}
                className="bg-[#2A1E1B] hover:bg-[#C5A059] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
              >
                <Edit3 size={14} /> Edit
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#E7DFD4]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FFFDF8] text-[10px] uppercase font-bold text-[#8A8174] tracking-wider border-b border-[#E7DFD4]">
                    <th className="p-4 pl-6 w-48">STAFF</th>
                    <th className="p-4 text-center">MON</th>
                    <th className="p-4 text-center">TUE</th>
                    <th className="p-4 text-center">WED</th>
                    <th className="p-4 text-center">THU</th>
                    <th className="p-4 text-center">FRI</th>
                    <th className="p-4 text-center">SAT</th>
                    <th className="p-4 text-center pr-6">SUN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7DFD4] text-xs font-sans">
                  {staffList.filter(s => !s.isArchived).map((staff) => (
                    <tr key={staff.id} className="hover:bg-[#FDFBF7] transition-colors">
                      <td className="p-4 pl-6">
                        <p className="font-bold text-[#2A1E1B]">{staff.name}</p>
                        <span className="text-[10px] text-[#8A8174]">{staff.role}</span>
                      </td>
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                        const shift = staff.shifts[day];
                        const isOff = shift === 'Off';
                        return (
                          <td key={day} className="p-4 text-center">
                            {isOff ? (
                              <span className="text-[#8A8174] font-medium text-xs">Off</span>
                            ) : (
                              <span className="inline-block bg-[#FEF3C7] text-[#92400E] border border-amber-200 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                                {shift}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= SUB-TAB 3: APPOINTMENTS ================= */}
        {activeSubTab === 'appointments' && (
          <div className="space-y-4 animate-fadeIn">
            {appointments.map((app) => (
              <div
                key={app.id}
                onClick={() => setSelectedAppointment(app)}
                className="p-5 rounded-2xl border border-[#E7DFD4] bg-[#FFFDF8] hover:border-[#C5A059] transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#2A1E1B] text-white font-bold flex items-center justify-center text-sm shrink-0">
                    {app.clientName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#2A1E1B] text-sm">{app.clientName}</h4>
                    <p className="text-xs text-[#8A8174] mt-0.5">
                      {app.serviceName} &bull; <strong className="text-[#2A1E1B]">{app.stylist}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6">
                  <div className="text-left sm:text-right">
                    <p className="font-bold text-[#2A1E1B] text-xs">{app.dateTime.split(' at ')[1]}</p>
                    <p className="text-[11px] text-[#8A8174]">{app.dateTime.split(' at ')[0]}</p>
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full ${app.status === 'CONFIRMED' ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* MODAL: ADD STAFF */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 z-50 w-screen h-screen flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-[28px] border border-[#E7DFD4] shadow-2xl max-w-md w-full p-6 space-y-5 text-[#2A1E1B]">
            <div className="flex items-center justify-between border-b border-[#E7DFD4] pb-3">
              <div className="flex items-center gap-2">
                <UserPlus size={18} className="text-[#C5A059]" />
                <h3 className="font-bold text-base">Add New Staff Member</h3>
              </div>
              <button onClick={() => setIsAddStaffModalOpen(false)} className="text-gray-400 hover:text-black">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddNewStaff} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Full Name*</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gian Carlo Dela Torre"
                  value={newStaffForm.name}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DFD4] bg-[#F8F5F0] text-xs font-medium text-[#2A1E1B] outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Email Address*</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. delatorre.giancarlobscs2024@gmail.com"
                  value={newStaffForm.email}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DFD4] bg-[#F8F5F0] text-xs font-medium text-[#2A1E1B] outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Assigned Role</label>
                  <select
                    value={newStaffForm.role}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DFD4] bg-[#F8F5F0] text-xs font-semibold text-[#2A1E1B] outline-none focus:border-[#C5A059]"
                  >
                    <option value="Stylist">Stylist</option>
                    <option value="Cashier">Cashier</option>
                    <option value="Therapist">Therapist</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Employment Type</label>
                  <select
                    value={newStaffForm.type}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DFD4] bg-[#F8F5F0] text-xs font-semibold text-[#2A1E1B] outline-none focus:border-[#C5A059]"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E7DFD4]">
                <button
                  type="button"
                  onClick={() => setIsAddStaffModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E7DFD4] text-xs font-bold text-gray-600 hover:bg-[#F8F5F0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2A1E1B] hover:bg-[#C5A059] text-white text-xs font-bold transition-all shadow-sm"
                >
                  Add Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT WEEKLY SCHEDULE */}
      {isEditScheduleModalOpen && (
        <div className="fixed inset-0 z-50 w-screen h-screen flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-[28px] border border-[#E7DFD4] shadow-2xl max-w-2xl w-full p-8 my-auto max-h-[90vh] overflow-y-auto space-y-6 text-[#2A1E1B]">
            <div className="flex items-start justify-between border-b border-[#E7DFD4] pb-4">
              <div>
                <h2 className="text-xl font-bold text-[#2A1E1B]">Edit weekly schedules</h2>
                <p className="text-xs text-[#8A8174] mt-0.5">Update regular working hours for employees.</p>
              </div>
              <button onClick={() => setIsEditScheduleModalOpen(false)} className="text-gray-400 hover:text-black p-1">
                <X size={20} />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl border border-emerald-600 bg-emerald-50/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#8B5E3C] text-white font-bold flex items-center justify-center text-xs">K</div>
                <div>
                  <p className="font-bold text-xs text-[#2A1E1B]">Karl Maverick Anonuevo</p>
                  <p className="text-[10px] text-[#8A8174]">Stylist</p>
                </div>
              </div>
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>

            <form onSubmit={handleSaveWeeklySchedule} className="space-y-4">
              <div className="space-y-3">
                {Object.keys(scheduleFormDays).map((dayName) => {
                  const dayData = scheduleFormDays[dayName];
                  return (
                    <div key={dayName} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-[#E7DFD4] bg-[#F8F5F0]">
                      <div className="flex items-center gap-3 w-40">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={dayData.active}
                            onChange={(e) => setScheduleFormDays({
                              ...scheduleFormDays,
                              [dayName]: { ...dayData, active: e.target.checked }
                            })}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                        <div>
                          <p className="font-bold text-xs text-[#2A1E1B]">{dayName}</p>
                          <p className="text-[10px] text-[#8A8174]">{dayData.active ? 'Working day' : 'Unavailable'}</p>
                        </div>
                      </div>

                      {dayData.active ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={dayData.start}
                            onChange={(e) => setScheduleFormDays({ ...scheduleFormDays, [dayName]: { ...dayData, start: e.target.value } })}
                            className="px-3 py-1.5 rounded-lg border border-[#E7DFD4] bg-white text-xs font-bold w-28 text-center"
                          />
                          <span className="text-xs text-[#8A8174]">to</span>
                          <input
                            type="text"
                            value={dayData.end}
                            onChange={(e) => setScheduleFormDays({ ...scheduleFormDays, [dayName]: { ...dayData, end: e.target.value } })}
                            className="px-3 py-1.5 rounded-lg border border-[#E7DFD4] bg-white text-xs font-bold w-28 text-center"
                          />
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded-md">8h</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium italic">No hours scheduled</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-[#E7DFD4] flex items-center justify-between">
                <p className="text-xs font-bold text-[#8A8174]">Weekly total {totalWeeklyHours} hours</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditScheduleModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-[#E7DFD4] bg-white text-xs font-bold text-[#2A1E1B] hover:bg-[#F8F5F0]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md"
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: APPOINTMENT VIEW DETAIL & VOID */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 w-screen h-screen flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-[28px] border border-[#E7DFD4] shadow-2xl max-w-3xl w-full p-8 my-auto space-y-6 text-[#2A1E1B]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Side: Booking Details */}
              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A8174]">BOOKING DETAILS</p>
                <div className="p-5 rounded-2xl border border-[#E7DFD4] bg-[#FFFDF8] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      &bull; {selectedAppointment.status}
                    </span>
                    <span className="text-xs font-bold text-[#8A8174]">Ref: #{selectedAppointment.id}</span>
                  </div>

                  <h3 className="text-2xl font-bold text-[#2A1E1B]">{selectedAppointment.serviceName}</h3>

                  <div className="flex items-center gap-6 text-xs text-[#2A1E1B] font-bold pt-2 border-t border-[#E7DFD4]/60">
                    <span className="flex items-center gap-1.5"><Clock size={15} /> {selectedAppointment.duration}</span>
                    <span>{selectedAppointment.price}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl border border-[#E7DFD4] bg-[#F8F5F0] flex items-center gap-3">
                  <CalendarIcon size={18} className="text-[#8B5E3C]" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-[#8A8174]">DATE & TIME</p>
                    <p className="text-xs font-bold text-[#2A1E1B]">{selectedAppointment.dateTime}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] uppercase font-bold text-[#8A8174] mb-1">STYLIST</p>
                  <p className="text-xs font-bold text-[#2A1E1B]">{selectedAppointment.stylist}</p>
                  <p className="text-[10px] text-[#8A8174]">Senior Stylist</p>
                </div>
              </div>

              {/* Right Side: Client Info & Notes */}
              <div className="space-y-4">
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase font-bold text-[#8A8174]">CLIENT</p>
                  <h4 className="font-bold text-sm text-[#2A1E1B]">{selectedAppointment.clientName}</h4>
                  <p className="text-xs text-[#8A8174]">{selectedAppointment.clientEmail}</p>
                  <p className="text-xs text-[#8A8174]">{selectedAppointment.clientPhone}</p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase font-bold text-[#8A8174]">SPECIAL REQUEST & NOTES</p>
                  <div className="p-3.5 rounded-xl border border-[#E7DFD4] bg-[#F8F5F0] text-xs text-[#8A8174] min-h-[90px]">
                    {selectedAppointment.notes || 'Notes should appear here...'}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setPendingVoidAppointment(selectedAppointment)}
                    className="w-1/2 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-all"
                  >
                    Void Appointment
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedAppointment(null)}
                    className="w-1/2 py-2.5 rounded-xl border border-[#E7DFD4] bg-white text-[#2A1E1B] hover:bg-[#F8F5F0] text-xs font-bold transition-all"
                  >
                    Close Tab
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL: ARCHIVE CONFIRMATION */}
      {archiveTargetStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E7DFD4] shadow-2xl max-w-md w-full p-6 space-y-5 text-[#2A1E1B]">
            <div className="flex items-center justify-between border-b border-[#E7DFD4] pb-3">
              <h3 className="font-bold text-base">Archive Staff Member</h3>
              <button onClick={() => setArchiveTargetStaff(null)} className="text-gray-400 hover:text-black">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to move <strong className="text-[#2A1E1B]">{archiveTargetStaff.name}</strong> to the Archived Bin?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setArchiveTargetStaff(null)}
                className="px-4 py-2 rounded-xl border border-[#E7DFD4] text-xs font-bold text-gray-600 hover:bg-[#F8F5F0]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setStaffList(staffList.map(s => s.id === archiveTargetStaff.id ? { ...s, isArchived: true } : s));
                  showToast(`Moved ${archiveTargetStaff.name} to Archived Bin`);
                  setArchiveTargetStaff(null);
                }}
                className="px-5 py-2 rounded-xl bg-[#2A1E1B] text-white text-xs font-bold hover:bg-[#C5A059] transition-all"
              >
                Move to Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PERMANENT DELETE CONFIRMATION */}
      {deleteTargetStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-rose-200 shadow-2xl max-w-md w-full p-6 space-y-5 text-[#2A1E1B]">
            <div className="flex items-center justify-between border-b border-[#E7DFD4] pb-3">
              <h3 className="font-bold text-base text-rose-700">Delete Staff Permanently</h3>
              <button onClick={() => setDeleteTargetStaff(null)} className="text-gray-400 hover:text-black">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              This action cannot be undone. Are you sure you want to permanently delete <strong className="text-[#2A1E1B]">{deleteTargetStaff.name}</strong>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteTargetStaff(null)}
                className="px-4 py-2 rounded-xl border border-[#E7DFD4] text-xs font-bold text-gray-600 hover:bg-[#F8F5F0]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setStaffList(staffList.filter(s => s.id !== deleteTargetStaff.id));
                  showToast(`Permanently deleted ${deleteTargetStaff.name}`);
                  setDeleteTargetStaff(null);
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingVoidAppointment && <ConfirmationModal title="Void appointment?" message={`This will void appointment #${pendingVoidAppointment.id} for ${pendingVoidAppointment.clientName}. This cannot be undone.`} confirmLabel="Void appointment" danger onCancel={() => setPendingVoidAppointment(null)} onConfirm={() => { handleVoidAppointment(pendingVoidAppointment.id); setPendingVoidAppointment(null); }} />}
    </div>
  );
}
