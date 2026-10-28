import {usePageFind} from '../../components/workspace/AdminWorkspaceContext';
import AdminPageHeader from '../../components/workspace/AdminPageHeader';
import UserManagementView from './UserManagementView';
import { useEffect, useRef, useState } from 'react';
import { readJsonResponse } from '../../api/client';

const DAY_NAMES=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const SHORT_DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Manila',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const addDays=(day,count)=>new Date(Date.parse(day+'T00:00:00Z')+count*86400000).toISOString().slice(0,10);
const currentMonday=()=>{const day=today();return addDays(day,-((new Date(day+'T00:00:00Z').getUTCDay()+6)%7));};
const hours=(day)=>day.active?Math.max(0,((Number(day.end.slice(0,2))*60+Number(day.end.slice(3)))-(Number(day.start.slice(0,2))*60+Number(day.start.slice(3))))/60):0;
const blankDays=()=>Object.fromEntries(DAY_NAMES.map(d=>[d,{active:false,start:'09:00',end:'17:00'}]));
import { 
  Search, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock,
  Lock,
  X, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  UserPlus
} from 'lucide-react';

export default function ScheduleManagementView({ showHeaderActions = true, currentUser }) {
  const [toastMessage, setToastMessage] = useState('');

  // Main Tab State: 'active' vs 'archived'
  const [mainTab, setMainTab] = useState('active');

  // Sub-Tab Navigation: 'roster' | 'schedule' | 'appointments'
  const [activeSubTab, setActiveSubTab] = useState('roster');

  // Search & Filter
  const [searchQuery, setSearchQuery,isHighlightSearch] = usePageFind();
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Staff accounts loaded from the backend
  const [staffList, setStaffList] = useState([]);

  // Existing bookings loaded from the appointments table
  const [appointments, setAppointments] = useState([]);
  const [appointmentView,setAppointmentView]=useState('active');
  const [appointmentPage,setAppointmentPage]=useState(1);
  const appointmentsPerPage=5;

  // Modals & Action Target States
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [isCreateStaffOpen, setIsCreateStaffOpen] = useState(false);
  const [isEditScheduleModalOpen, setIsEditScheduleModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [archiveTargetStaff, setArchiveTargetStaff] = useState(null);
  const [deleteTargetStaff, setDeleteTargetStaff] = useState(null);

  // Form States
  const [newStaffForm, setNewStaffForm] = useState({userId:'',role:'Unassigned',type:'Full-time',onLeave:false,profileVersion:null});

  const [scheduleFormDays, setScheduleFormDays] = useState(blankDays);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Filter Logic
  const filteredStaff = staffList.filter(s => {
    const matchesTab = mainTab === 'active' ? !s.isArchived : s.isArchived;
    const matchesSearch = isHighlightSearch || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.email.toLowerCase().includes(searchQuery.toLowerCase());
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

  const totalWeeklyHours = Object.values(scheduleFormDays).reduce((sum,day)=>sum+hours(day),0);
  const [week,setWeek]=useState(currentMonday);
  const [staffUsers,setStaffUsers]=useState([]);
  const [staffJobRoles,setStaffJobRoles]=useState([]);
  const [selectedStaffId,setSelectedStaffId]=useState('');
  const [editingRevision,setEditingRevision]=useState('');
  const [scheduleFormError,setScheduleFormError]=useState('');
  const [appointmentTotal,setAppointmentTotal]=useState(0);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [pending,setPending]=useState(null);
  const [pin,setPin]=useState('');
  const [pinError,setPinError]=useState('');
  const [busy,setBusy]=useState(false);
  const running=useRef(false);
  const token=currentUser?.accessToken;
  const selectedScheduleStaff=staffList.find(staff=>String(staff.id)===String(selectedStaffId));
  const schedulableStaff=staffList.filter(staff=>!staff.isArchived&&staff.accountActive&&staff.status!=='Inactive'&&!staff.onLeave);
  const filteredAppointments=isHighlightSearch?appointments:appointments.filter(app=>[app.clientName,app.clientEmail,app.serviceName,app.stylist,app.reference].some(value=>String(value||'').toLowerCase().includes(searchQuery.toLowerCase())));
  const appointmentPages=Math.max(1,Math.ceil(filteredAppointments.length/appointmentsPerPage));
  const paginatedAppointments=filteredAppointments.slice((appointmentPage-1)*appointmentsPerPage,appointmentPage*appointmentsPerPage);
  const appointmentFilterQuery=isHighlightSearch?'':searchQuery;
  useEffect(()=>{setAppointmentPage(1);},[appointmentFilterQuery,appointmentView]);
  useEffect(()=>{setAppointmentPage(page=>Math.min(page,appointmentPages));},[appointmentPages]);
  function switchAppointments(view){setAppointments([]);setAppointmentTotal(0);setSelectedAppointment(null);setAppointmentView(view);setAppointmentPage(1);}
  function retrieveAppointment(appointment){
    queue({path:'/appointments/'+appointment.id+'/retrieve',method:'PATCH',label:'Retrieve appointment #'+appointment.reference+' for '+appointment.clientName,
      message:'Appointment retrieved to the active list.',done:()=>setSelectedAppointment(null)});
  }
  function cancelAppointment(appointment){
    queue({path:'/appointments/'+appointment.id+'/cancel',method:'PATCH',label:'Cancel and archive appointment #'+appointment.reference+' for '+appointment.clientName,
      message:'Appointment cancelled and moved to Archived appointments.',done:()=>setSelectedAppointment(null)});
  }
  async function request(path='',method='GET',body,actionPin) {
    if(!token)throw new Error('Sign in as an Admin to manage staff schedules.');
    const response=await fetch('/api/admin/schedule'+path,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',...(actionPin?{'x-management-pin':actionPin}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{})});
    const data=await readJsonResponse(response);
    if(!response.ok)throw new Error(Array.isArray(data.message)?data.message.join(' '):data.message||'Schedule request failed.');
    return data;
  }
  async function fetchData() {
    const [roster,users,bookings,jobRoles]=await Promise.all([request('?week='+week),request('/staff-users'),request('/appointments?archived='+(appointmentView==='archived')),request('/staff-job-roles')]);
    return {roster,users,bookings,jobRoles};
  }
  function applyData(data) {
    setStaffJobRoles(data.jobRoles);setStaffList(data.roster);setStaffUsers(data.users);setAppointments(data.bookings.items);setAppointmentTotal(data.bookings.total);
  }
  async function refresh() {
    setLoading(true);
    try{applyData(await fetchData());setError('');}catch(e){setError(e.message);}finally{setLoading(false);}
  }
  useEffect(()=>{
    let active=true;setLoading(true);setError('');
    fetchData().then(data=>{if(active)applyData(data);}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[token,week,appointmentView]);
  useEffect(()=>{setCurrentPage(p=>Math.min(p,totalPages));},[totalPages]);
  function chooseStaffDetails(id) {
    const staff=staffUsers.find(u=>String(u.id)===String(id));
    setNewStaffForm({userId:id,role:staffJobRoles.includes(staff?.role)?staff.role:'Unassigned',type:staff?.type||'Full-time',onLeave:staff?.onLeave||false,profileVersion:staff?.profileVersion??null});
  }
  function chooseSchedule(id) {
    const staff=staffList.find(u=>String(u.id)===String(id));
    if(!staff)return;
    if(!staff.editable){setError('This week has split or overnight shifts. Existing shifts are preserved.');return;}
    setScheduleFormError('');setSelectedStaffId(String(id));setEditingRevision(staff.revision);
    setScheduleFormDays(Object.fromEntries(DAY_NAMES.map((name,i)=>[name,{...staff.days[SHORT_DAYS[i]]}])));
  }
  function openSchedule() {
    const staff=schedulableStaff.find(staff=>staff.editable);
    if(!staff){setError('No available Staff accounts to schedule. Check account status, leave, and existing shifts.');return;}
    chooseSchedule(staff.id);setIsEditScheduleModalOpen(true);
  }
  function queue(task) {if(!running.current){setPin('');setPinError('');setPending(task);}}
  async function confirmAction(e) {
    e.preventDefault();if(running.current||!pending)return;
    if(!/^\d{6}$/.test(pin)){setPinError('Enter your six-digit management PIN.');return;}
    running.current=true;setBusy(true);setPinError('');
    try {
      await request(pending.path,pending.method,pending.body,pin);
      pending.done?.();setPending(null);setPin('');showToast(pending.message);
      try{applyData(await fetchData());setError('');}catch{setError('Your change was saved. Refresh to load the latest schedule.');}
    }catch(e){setPinError(e.message);}finally{running.current=false;setBusy(false);setPin('');}
  }
  function handleAddNewStaff(e) {
    e.preventDefault();if(!newStaffForm.userId)return;
    const staff=staffUsers.find(s=>String(s.id)===String(newStaffForm.userId));
    queue({path:'/staff/'+newStaffForm.userId+'/details',method:'PUT',body:{role:newStaffForm.role,type:newStaffForm.type,onLeave:newStaffForm.onLeave,profileVersion:newStaffForm.profileVersion},
      label:'Update staff details for '+staff?.name,message:'Staff details saved.',done:()=>setIsAddStaffModalOpen(false)});
  }
  function handleSaveWeeklySchedule(e) {
    e.preventDefault();setScheduleFormError('');if(!selectedScheduleStaff)return;
    const days=DAY_NAMES.map((name,i)=>({date:addDays(week,i),...scheduleFormDays[name]}));
    if(days.some(d=>d.active&&(!d.start||!d.end||d.start>=d.end))){setScheduleFormError('Each working day must have an end time after its start time.');return;}
    queue({path:'/staff/'+selectedStaffId+'/week',method:'PUT',body:{week,revision:editingRevision,days},
      label:'Save '+selectedScheduleStaff.name+'’s schedule for '+week,message:'Weekly schedule saved.',done:()=>setIsEditScheduleModalOpen(false)});
  }
  function changeStaffState(staff,state) {
    if(staff.accountArchived){setError('Restore this account in User Management first.');return;}
    queue({path:'/staff/'+staff.id+(state==='hide'?'':'/'+state),method:state==='hide'?'DELETE':'PATCH',
      label:(state==='archive'?'Archive ':state==='restore'?'Restore ':'Remove from roster: ')+staff.name,
      message:'Staff roster updated.',done:()=>{setArchiveTargetStaff(null);setDeleteTargetStaff(null);}});
  }

  const renderRoleBadge = (role) => {
    const roleColors = {
      'Nail Technician':'bg-pink-50 text-pink-700 border border-pink-200',
      'Lash/Brow Technician':'bg-violet-50 text-violet-700 border border-violet-200',
      'Receptionist':'bg-orange-50 text-orange-700 border border-orange-200',
      'Hair Stylist': 'bg-[#F3E8FF] text-[#7E22CE] border border-purple-200',
      'Cashier': 'bg-[#E0F2FE] text-[#0369A1] border border-sky-200',
      'Beauty Therapist': 'bg-[#CCFBF1] text-[#0F766E] border border-teal-200'
    };
    return (
      <span className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${roleColors[role] || 'bg-gray-100 text-gray-700'}`}>
        {role}
      </span>
    );
  };

  const renderStatusBadge = (status) => {
    if(status==='Inactive')return <span className="text-xs font-bold text-gray-500">INACTIVE</span>;
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
      <AdminPageHeader title="Staff & Schedule Management" subtitle="Manage employee rosters, weekly shifts, and client bookings" showHeaderActions={showHeaderActions}/>

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

      {loading && <p role="status" className="text-sm">Loading staff, shifts and appointments…</p>}
      {error && <div role="alert" className="rounded-xl p-4 bg-rose-50 border border-rose-200 text-sm">{error} <button type="button" onClick={refresh} className="underline ml-2">Refresh</button></div>}
      {/* MAIN CONTAINER SQUARE - Exactly matching Client and Inventory layout */}
      <div className="bg-white rounded-2xl border border-[#E7DFD4] shadow-sm p-6 sm:p-8 space-y-6">

        {/* Main Toolbar inside the square */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

          {/* Left Title & Active/Archived Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#2A1E1B]">{activeSubTab==='appointments'?'Appointments':'Staff Roster'}</h2>
              <span className="bg-[#2A1E1B] text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                {activeSubTab==='appointments'?filteredAppointments.length:filteredStaff.length}
              </span>
            </div>

            {/* Active Roster vs Archived Bin Toggle */}
            {activeSubTab!=='appointments' && <div className="flex items-center bg-[#F8F5F0] p-1 rounded-xl border border-[#E7DFD4] ml-2">
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
            </div>}
          </div>

          {/* Right Inputs + ADD STAFF BUTTON INSIDE THE SQUARE */}
          <div className="flex flex-wrap items-center gap-3">

            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A8174]" />
              <input
                type="text"
                placeholder={isHighlightSearch?'Highlight text on this page…':activeSubTab==='appointments'?'Search client, staff or service...':'Search staff name or email...'}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); if(!isHighlightSearch)setCurrentPage(1); }}
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
                <option value="Unassigned">Unassigned</option>
                    {staffJobRoles.map(role=><option key={role} value={role}>{role}</option>)}
              </select>
            )}

            {/* ADD STAFF BUTTON - Placed inside main container box */}
            <button
              onClick={() => setIsCreateStaffOpen(true)}
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
                        {loading?'Loading staff…':error?'Staff could not be loaded.':mainTab === 'active' ? 'No Staff accounts found. Add Staff accounts in User Management.' : 'Archived staff bin is empty.'}
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
                            <div className="flex items-center justify-center gap-1">
                              {staff.accountActive && <button type="button" onClick={()=>{chooseStaffDetails(staff.id);setIsAddStaffModalOpen(true);}} aria-label={'Edit staff details for '+staff.name} title="Edit staff details" className="rounded-lg p-2 text-[#8A8174] transition-colors hover:bg-[#F8F5F0] hover:text-[#8B5E3C]"><Edit3 size={16}/></button>}
                              <button type="button" onClick={() => setArchiveTargetStaff(staff)} className="p-2 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors" title="Archive Staff Member"><Trash2 size={16}/></button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => changeStaffState(staff,'restore')}
                                className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center gap-1 font-bold text-[11px]"
                                title="Restore Staff Member"
                              >
                                <RotateCcw size={14} /> Restore
                              </button>
                              <button
                                onClick={() => setDeleteTargetStaff(staff)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                                title="Remove from Roster"
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
                <p className="text-xs text-[#8A8174]">Staff availability for {week} to {addDays(week,6)} (Manila time)</p>
              </div>
              <button
                onClick={openSchedule}
                className="bg-[#2A1E1B] hover:bg-[#C5A059] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
              >
                <Edit3 size={14} /> Edit
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs"><button type="button" aria-label="Previous week" onClick={()=>setWeek(addDays(week,-7))} className="border rounded-lg p-2"><ChevronLeft size={16}/></button><input aria-label="Schedule week" type="date" min="2000-01-03" max="2099-12-28" value={week} onChange={e=>{if(e.target.value){const day=e.target.value;setWeek(addDays(day,-((new Date(day+'T00:00:00Z').getUTCDay()+6)%7)));}}} className="border rounded-lg p-2"/><button type="button" aria-label="Next week" onClick={()=>setWeek(addDays(week,7))} className="border rounded-lg p-2"><ChevronRight size={16}/></button><button
                type="button"
                onClick={() => setWeek(currentMonday())}
                aria-pressed={week === currentMonday()}
                title={week === currentMonday() ? 'Viewing the current week' : 'Return to the current week'}
                className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B5E3C] ${week === currentMonday()
                  ? 'border-[#8B5E3C] bg-[#8B5E3C] text-white hover:bg-[#724B2F]'
                  : 'border-[#E7DFD4] bg-white text-[#8B5E3C] hover:border-[#8B5E3C] hover:bg-[#F8F5F0]'}`}
              >
                {week === currentMonday() ? <CheckCircle2 size={15} aria-hidden="true" /> : <CalendarIcon size={15} aria-hidden="true" />}
                This week
              </button></div>
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
                  {filteredStaff.map((staff) => (
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-xl border border-[#E7DFD4] bg-[#F8F5F0] p-1" aria-label="Appointment lists">
                {['active','archived'].map(view=><button key={view} type="button" aria-pressed={appointmentView===view} onClick={()=>switchAppointments(view)} className={`rounded-lg px-3.5 py-2 text-xs font-bold transition-colors ${appointmentView===view?'bg-[#2A1E1B] text-white shadow-sm':'text-[#8A8174] hover:text-[#2A1E1B]'}`}>{view==='active'?'Active appointments':'Archived appointments'}</button>)}
              </div>
              <span className="text-xs text-[#8A8174]">{filteredAppointments.length} {appointmentView==='archived'?'archived':'active'} appointments</span>
            </div>
            {appointmentTotal>appointments.length && <p className="text-xs">Showing the latest {appointments.length} of {appointmentTotal} appointments.</p>}
            {filteredAppointments.length===0 && <p className="text-sm text-[#8A8174]">{loading?'Loading appointments…':'No appointments found.'}</p>}
            {paginatedAppointments.map((app) => (
              <div
                key={app.id}
                role="button" tabIndex={0} aria-label={app.clientName+' appointment '+app.reference}
                onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelectedAppointment(app);}}}
                onClick={() => setSelectedAppointment(app)}
                className="p-5 rounded-2xl border border-[#E7DFD4] bg-[#FFFDF8] hover:border-[#C5A059] transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#2A1E1B] text-white font-bold flex items-center justify-center text-sm shrink-0">
                    {app.clientName.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0,3)}
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
                  <span className="text-[10px] font-bold text-[#8A8174]">{app.status.replaceAll('_',' ')}</span>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-[#8A8174]">
              <span>Showing {filteredAppointments.length?(appointmentPage-1)*appointmentsPerPage+1:0}–{Math.min(appointmentPage*appointmentsPerPage,filteredAppointments.length)} of {filteredAppointments.length} appointments</span>
              <div className="flex items-center gap-3"><button type="button" aria-label="Previous appointments page" disabled={appointmentPage===1||loading} onClick={()=>setAppointmentPage(page=>Math.max(1,page-1))} className="rounded-xl border border-[#E7DFD4] p-2 disabled:opacity-40"><ChevronLeft size={16}/></button><span>Page {appointmentPage} of {appointmentPages}</span><button type="button" aria-label="Next appointments page" disabled={appointmentPage===appointmentPages||loading} onClick={()=>setAppointmentPage(page=>Math.min(appointmentPages,page+1))} className="rounded-xl border border-[#E7DFD4] p-2 disabled:opacity-40"><ChevronRight size={16}/></button></div>
            </div>
          </div>
        )}

      </div>

      {pending && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fadeIn">
          <section role="dialog" aria-modal="true" aria-labelledby="schedule-pin-title" aria-describedby="schedule-pin-description schedule-pin-action" className="w-full max-w-sm space-y-5 rounded-3xl border border-[#E9E4D8] bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#E9DCB3] bg-[#FFFDF3] text-[#B4833F] shadow-xs">
              <Lock className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h2 id="schedule-pin-title" className="text-base font-bold text-[#2A1E1B]">Admin Authorization</h2>
              <p id="schedule-pin-description" className="mt-1 text-xs text-[#8A8174]">Enter your six-digit management PIN to confirm this action.</p>
              <p id="schedule-pin-action" className="sr-only">{pending.label}</p>
            </div>
            <form onSubmit={confirmAction} className="space-y-4">
              <input
                aria-label="Management PIN"
                type="password"
                autoFocus
                autoComplete="off"
                inputMode="numeric"
                pattern="[0-9]{6}"
                minLength={6}
                maxLength={6}
                required
                placeholder="••••••"
                disabled={busy}
                value={pin}
                onChange={e=>setPin(e.target.value.replace(/\D/g,'').slice(0,6))}
                aria-invalid={Boolean(pinError)}
                aria-describedby={pinError ? 'schedule-pin-error' : undefined}
                className="w-full rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] px-4 py-3 text-center text-lg font-bold tracking-[0.5em] text-[#2A1E1B] outline-none focus:border-[#C5A059] disabled:opacity-60"
              />
              {pinError && <p id="schedule-pin-error" role="alert" className="text-xs font-medium text-red-600">{pinError}</p>}
              <p className="text-[10px] text-[#8A8174]">Your management PIN is verified against your account, not a shared test code.</p>
              <div className="flex items-center gap-2 pt-2">
                <button type="button" disabled={busy} onClick={()=>{setPending(null);setPin('');setPinError('');}} className="flex-1 rounded-xl bg-[#EFECE6] px-4 py-2.5 text-xs font-bold text-[#5C524B] transition-colors hover:bg-[#E4E0D8] disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={busy} className="flex-1 rounded-xl bg-[#4A3928] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-[#3A2E2B] active:scale-95 disabled:opacity-50">{busy ? 'Confirming…' : 'Confirm PIN'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
      {isCreateStaffOpen && <UserManagementView currentUser={currentUser} showHeaderActions={false} createStaffOnly onClose={()=>setIsCreateStaffOpen(false)} onCreated={()=>refresh()}/>}
      {/* MODAL: EDIT STAFF DETAILS */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 z-50 w-screen h-screen flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-[28px] border border-[#E7DFD4] shadow-2xl max-w-md w-full p-6 space-y-5 text-[#2A1E1B]">
            <div className="flex items-center justify-between border-b border-[#E7DFD4] pb-3">
              <div className="flex items-center gap-2">
                <UserPlus size={18} className="text-[#C5A059]" />
                <h3 className="font-bold text-base">Edit Staff Details</h3>
              </div>
              <button onClick={() => setIsAddStaffModalOpen(false)} className="text-gray-400 hover:text-black">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddNewStaff} className="space-y-4">
              <p className="text-xs text-[#8A8174]">Choose an existing Staff account from Users. Names and emails stay linked to that account.</p>
              <label className="block text-xs font-bold">Staff account<select required value={newStaffForm.userId} onChange={e=>chooseStaffDetails(e.target.value)} className="block w-full p-3 border rounded-xl mt-2"><option value="">Select staff</option>{staffUsers.map(staff=><option key={staff.id} value={staff.id}>{staff.name} — {staff.email}</option>)}</select></label>
              {staffUsers.length===0 && <p className="text-sm">No active Staff accounts available. Add a Staff account in Users first.</p>}
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={newStaffForm.onLeave} onChange={e=>setNewStaffForm({...newStaffForm,onLeave:e.target.checked})}/> On leave</label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1" htmlFor="schedule-field-1">Job Role</label>
                  <select id="schedule-field-1"
                    value={newStaffForm.role}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DFD4] bg-[#F8F5F0] text-xs font-semibold text-[#2A1E1B] outline-none focus:border-[#C5A059]"
                  >
                    <option value="Unassigned">Unassigned</option>
                    {staffJobRoles.map(role=><option key={role} value={role}>{role}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1" htmlFor="schedule-field-2">Employment Type</label>
                  <select id="schedule-field-2"
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
                  Save Staff Details
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
                <p className="text-xs text-[#8A8174] mt-0.5">Set working days and hours for the selected week. Completed shifts are read-only.</p>
              </div>
              <button onClick={() => setIsEditScheduleModalOpen(false)} className="text-gray-400 hover:text-black p-1">
                <X size={20} />
              </button>
            </div>

            <section aria-label="Selected staff and week" className="rounded-2xl border border-[#E7DFD4] bg-[#FAF7F2] p-4 sm:p-5">
              <div className="flex items-start gap-3 sm:gap-4">
                <div aria-hidden="true" className="mt-5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#8B5E3C] text-sm font-bold text-white shadow-sm">
                  {selectedScheduleStaff?.name?.split(' ').filter(Boolean).slice(0,2).map(part=>part[0]).join('')}
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                  <label htmlFor="schedule-staff-member" className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174]">Staff member</label>
                  <div className="relative">
                    <select id="schedule-staff-member" value={selectedStaffId} onChange={e=>chooseSchedule(e.target.value)} className="w-full appearance-none rounded-xl border border-[#DED2C2] bg-white py-3 pl-3.5 pr-10 text-sm font-semibold text-[#2A1E1B] shadow-sm outline-none transition-colors hover:border-[#B58D54] focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/15">
                      {schedulableStaff.filter(staff=>staff.editable).map(staff=><option key={staff.id} value={staff.id}>{staff.name}</option>)}
                    </select>
                    <ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8B5E3C]" />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-[#8A8174]">
                    <span className="rounded-lg border border-[#E5D8C8] bg-[#F1E7DA] px-2.5 py-1 font-semibold text-[#785235]">{selectedScheduleStaff?.role}</span>
                    <span className="inline-flex items-center gap-1.5"><CalendarIcon size={13} aria-hidden="true" />{new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(week+'T00:00:00Z'))} – {new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(addDays(week,6)+'T00:00:00Z'))}</span>
                    <span>Manila time</span>
                  </div>
                </div>
              </div>
            </section>

            <form onSubmit={handleSaveWeeklySchedule} className="space-y-4">
              {scheduleFormError && <p role="alert" className="text-sm text-rose-700">{scheduleFormError}</p>}
              <div className="space-y-3">
                {Object.keys(scheduleFormDays).map((dayName) => {
                  const dayData = scheduleFormDays[dayName];
                  return (
                    <div key={dayName} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-[#E7DFD4] bg-[#F8F5F0]">
                      <div className="flex items-center gap-3 w-40">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            aria-label={dayName+' working day'}
                            disabled={Boolean(dayData.completed)}
                            checked={dayData.active}
                            onChange={(e) => setScheduleFormDays({
                              ...scheduleFormDays,
                              [dayName]: { ...dayData, active: e.target.checked }
                            })}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#8B5E3C] peer-focus-visible:ring-2 peer-focus-visible:ring-[#8B5E3C]/30 peer-focus-visible:ring-offset-2 peer-disabled:opacity-50"></div>
                        </label>
                        <div>
                          <p className="font-bold text-xs text-[#2A1E1B]">{dayName}</p>
                          <p className="text-[10px] text-[#8A8174]">{dayData.completed ? 'Completed shift' : dayData.active ? 'Working day' : 'Day off'}</p>
                        </div>
                      </div>

                      {dayData.active ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="time" required aria-label={dayName+' start time'} disabled={Boolean(dayData.completed)}
                            value={dayData.start}
                            onChange={(e) => setScheduleFormDays({ ...scheduleFormDays, [dayName]: { ...dayData, start: e.target.value } })}
                            className="px-3 py-1.5 rounded-lg border border-[#E7DFD4] bg-white text-xs font-bold w-28 text-center"
                          />
                          <span className="text-xs text-[#8A8174]">to</span>
                          <input
                            type="time" required aria-label={dayName+' end time'} disabled={Boolean(dayData.completed)}
                            value={dayData.end}
                            onChange={(e) => setScheduleFormDays({ ...scheduleFormDays, [dayName]: { ...dayData, end: e.target.value } })}
                            className="px-3 py-1.5 rounded-lg border border-[#E7DFD4] bg-white text-xs font-bold w-28 text-center"
                          />
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded-md">{hours(dayData).toFixed(1)}h</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium italic">No hours scheduled</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-[#E7DFD4] flex items-center justify-between">
                <p className="text-xs font-bold text-[#8A8174]">Weekly total {totalWeeklyHours.toFixed(1)} hours</p>
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
                    <span className="text-xs font-bold text-[#8A8174]">Ref: #{selectedAppointment.reference}</span>
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
                    {selectedAppointment.notes || 'No notes provided.'}
                  </div>
                </div>

                {selectedAppointment.isArchived && <div className="mt-4 rounded-xl border border-[#E7DFD4] bg-[#F8F5F0] p-3 text-xs text-[#8A8174]"><strong className="text-[#2A1E1B]">Archived appointment</strong><p className="mt-1">{selectedAppointment.archiveReason||'This appointment is archived.'}</p></div>}
                {!selectedAppointment.isArchived && ['PENDING','CONFIRMED','AWAITING_DEPOSIT','PAYMENT_REVIEW'].includes(selectedAppointment.status) && String(selectedAppointment.paymentStatus||'').includes('PAID') && <p className="mt-4 text-xs text-[#8A8174]">Cancelling the appointment does not issue a refund.</p>}
                <div className="flex items-center gap-3 pt-6">
                  {selectedAppointment.isArchived && <button type="button" onClick={()=>retrieveAppointment(selectedAppointment)} className="flex w-1/2 items-center justify-center gap-2 rounded-xl bg-[#8B5E3C] py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#724B2F]"><RotateCcw size={14}/>Retrieve appointment</button>}
                  {!selectedAppointment.isArchived && ['PENDING','CONFIRMED','AWAITING_DEPOSIT','PAYMENT_REVIEW'].includes(selectedAppointment.status) && <button type="button" onClick={()=>cancelAppointment(selectedAppointment)} className="w-1/2 rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100">Cancel appointment</button>}
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
                onClick={() => changeStaffState(archiveTargetStaff,'archive')}
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
              <h3 className="font-bold text-base text-rose-700">Remove Archived Staff</h3>
              <button onClick={() => setDeleteTargetStaff(null)} className="text-gray-400 hover:text-black">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Remove <strong className="text-[#2A1E1B]">{deleteTargetStaff.name}</strong> from this roster? Their user account, schedules and appointment history will remain.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteTargetStaff(null)}
                className="px-4 py-2 rounded-xl border border-[#E7DFD4] text-xs font-bold text-gray-600 hover:bg-[#F8F5F0]"
              >
                Cancel
              </button>
              <button
                onClick={() => changeStaffState(deleteTargetStaff,'hide')}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all"
              >
                Remove from Roster
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
