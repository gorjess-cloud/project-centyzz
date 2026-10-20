import { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  KeyRound, 
  Edit3, 
  UserX, 
  UserCheck, 
  X, 
  CheckCircle2, 
  Lock,
  Archive,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function UserManagementView({ currentUser }) {
  const loggedInRole = (currentUser?.role || 'ADMIN').toUpperCase();
  const loggedInEmail = currentUser?.email || 'MillicentCampillos@example.com';

  const [users, setUsers] = useState([
    { id: 'usr_1', firstName: 'Millicent', lastName: 'Campillo', fullName: 'Millicent Campillo', email: 'milliecentyzz@gmail.com', contactNumber: '0912345678', role: 'ADMIN', status: 'ACTIVE', isArchived: false, dateCreated: 'Aug 16, 2026', avatarColor: 'bg-[#4A3928]' },
    { id: 'usr_2', firstName: 'Jessica', lastName: 'Palma', fullName: 'Jessica Palma', email: 'palma.jessicamae@gmail.com', contactNumber: '0998765432', role: 'STAFF', status: 'INACTIVE', isArchived: false, dateCreated: 'Aug 16, 2026', avatarColor: 'bg-[#9B6B39]' },
    { id: 'usr_3', firstName: 'Chashmere', lastName: 'T.', fullName: 'Chashmere T.', email: 'chashmerejoy@gmail.com', contactNumber: '0911223344', role: 'STAFF', status: 'ACTIVE', isArchived: false, dateCreated: 'Aug 16, 2026', avatarColor: 'bg-[#4A3928]' },
    { id: 'usr_4', firstName: 'Romelle', lastName: 'Navea', fullName: 'Romelle Navea', email: 'romellenavea@gmail.com', contactNumber: '0922334455', role: 'STAFF', status: 'INACTIVE', isArchived: false, dateCreated: 'Aug 16, 2026', avatarColor: 'bg-[#2E4A39]' },
    { id: 'usr_5', firstName: 'Karl', lastName: 'Aljean', fullName: 'Karl Aljean', email: 'karlaljean@gmail.com', contactNumber: '0933445566', role: 'STAFF', status: 'ACTIVE', isArchived: false, dateCreated: 'Aug 16, 2026', avatarColor: 'bg-[#3A342B]' },
    { id: 'usr_6', firstName: 'Bea', lastName: 'Alonzo', fullName: 'Bea Alonzo', email: 'bea.alonzo@example.com', contactNumber: '0944556677', role: 'STAFF', status: 'ACTIVE', isArchived: false, dateCreated: 'Aug 18, 2026', avatarColor: 'bg-[#5C4033]' },
    { id: 'usr_7', firstName: 'John', lastName: 'Lloyd', fullName: 'John Lloyd', email: 'johnlloyd@example.com', contactNumber: '0955667788', role: 'STAFF', status: 'ACTIVE', isArchived: false, dateCreated: 'Aug 19, 2026', avatarColor: 'bg-[#3E2723]' },
    { id: 'usr_8', firstName: 'Sarah', lastName: 'Geronimo', fullName: 'Sarah Geronimo', email: 'sarahg@example.com', contactNumber: '0966778899', role: 'ADMIN', status: 'ACTIVE', isArchived: false, dateCreated: 'Aug 20, 2026', avatarColor: 'bg-[#4E342E]' },
    { id: 'usr_9', firstName: 'Vice', lastName: 'Ganda', fullName: 'Vice Ganda', email: 'viceganda@example.com', contactNumber: '0977889900', role: 'STAFF', status: 'ACTIVE', isArchived: false, dateCreated: 'Aug 22, 2026', avatarColor: 'bg-[#5D4037]' },
    { id: 'usr_10', firstName: 'Anne', lastName: 'Curtis', fullName: 'Anne Curtis', email: 'annecurtis@example.com', contactNumber: '0988990011', role: 'STAFF', status: 'INACTIVE', isArchived: false, dateCreated: 'Aug 25, 2026', avatarColor: 'bg-[#6D4C41]' },
    { id: 'usr_11', firstName: 'Kathryn', lastName: 'Bernardo', fullName: 'Kathryn Bernardo', email: 'kathryn@example.com', contactNumber: '0999001122', role: 'STAFF', status: 'ACTIVE', isArchived: false, dateCreated: 'Sep 01, 2026', avatarColor: 'bg-[#4A3928]' },
    { id: 'usr_12', firstName: 'Daniel', lastName: 'Padilla', fullName: 'Daniel Padilla', email: 'daniel@example.com', contactNumber: '0911223355', role: 'STAFF', status: 'ACTIVE', isArchived: false, dateCreated: 'Sep 03, 2026', avatarColor: 'bg-[#3A342B]' },
    { id: 'usr_13', firstName: 'Liza', lastName: 'Soberano', fullName: 'Liza Soberano', email: 'liza@example.com', contactNumber: '0922334466', role: 'STAFF', status: 'ACTIVE', isArchived: false, dateCreated: 'Sep 05, 2026', avatarColor: 'bg-[#9B6B39]' },
    { id: 'usr_14', firstName: 'Enrique', lastName: 'Gil', fullName: 'Enrique Gil', email: 'enrique@example.com', contactNumber: '0933445577', role: 'ADMIN', status: 'ACTIVE', isArchived: false, dateCreated: 'Sep 10, 2026', avatarColor: 'bg-[#2E4A39]' },
    { id: 'usr_15', firstName: 'Nadine', lastName: 'Lustre', fullName: 'Nadine Lustre', email: 'nadine@example.com', contactNumber: '0944556688', role: 'STAFF', status: 'INACTIVE', isArchived: false, dateCreated: 'Sep 12, 2026', avatarColor: 'bg-[#5C4033]' },
  ]);

  const [activeTab, setActiveTab] = useState('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', contactNumber: '' });
  
  // PIN Verification Security Modal State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

  const [toastMessage, setToastMessage] = useState('');

  const [newUserForm, setNewUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'STAFF',
    tempPassword: '',
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const requestAdminPin = (actionCallback) => {
    setPendingAction(() => actionCallback);
    setAdminPin('');
    setPinError('');
    setIsPinModalOpen(true);
  };

  const handleVerifyPinSubmit = (e) => {
    e.preventDefault();
    if (adminPin !== '1234') {
      setPinError('Incorrect Admin PIN. (Default test PIN is 1234)');
      return;
    }

    setIsPinModalOpen(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const tabFilteredUsers = users.filter((u) => {
    if (activeTab === 'ACTIVE') return !u.isArchived;
    return u.isArchived;
  });

  const filteredUsers = tabFilteredUsers.filter((u) => {
    if (loggedInRole === 'ADMIN' && u.role === 'SUPERADMIN') return false;
    
    const matchesSearch = 
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUserIds(paginatedUsers.map((u) => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectUser = (id) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddUserSubmit = (e) => {
    e.preventDefault();
    if (!newUserForm.firstName || !newUserForm.email) return;

    requestAdminPin(() => {
      const fullName = `${newUserForm.firstName} ${newUserForm.lastName}`.trim();
      const newUser = {
        id: `usr_${Date.now()}`,
        firstName: newUserForm.firstName,
        lastName: newUserForm.lastName,
        fullName,
        email: newUserForm.email,
        contactNumber: '0900000000',
        role: newUserForm.role,
        status: 'ACTIVE',
        isArchived: false,
        dateCreated: 'Oct 21, 2026',
        avatarColor: 'bg-[#4A3928]',
      };

      setUsers([newUser, ...users]);
      setIsAddUserOpen(false);
      setNewUserForm({ firstName: '', lastName: '', email: '', role: 'STAFF', tempPassword: '' });
      showToast(`Successfully added user ${fullName} as ${newUser.role}`);
    });
  };

  const handleRoleChange = (targetUser, newRole) => {
    requestAdminPin(() => {
      setUsers(users.map(u => u.id === targetUser.id ? { ...u, role: newRole } : u));
      setActiveMenuId(null);
      showToast(`Successfully changed ${targetUser.fullName}'s role to ${newRole}`);
    });
  };

  const handleToggleStatus = (targetUser) => {
    if (targetUser.email === loggedInEmail) {
      showToast('Action restricted: You cannot deactivate your own account.');
      setActiveMenuId(null);
      return;
    }

    if (loggedInRole === 'ADMIN' && targetUser.role === 'ADMIN') {
      showToast('Action restricted: Admins cannot deactivate other Admin accounts.');
      setActiveMenuId(null);
      return;
    }

    requestAdminPin(() => {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUser.id
            ? { ...u, status: u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }
            : u
        )
      );
      setActiveMenuId(null);
      showToast(`Updated ${targetUser.fullName}'s status`);
    });
  };

  const handleToggleArchive = (targetUser) => {
    if (targetUser.email === loggedInEmail && !targetUser.isArchived) {
      showToast('Action restricted: You cannot archive your own active account.');
      setActiveMenuId(null);
      return;
    }

    requestAdminPin(() => {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUser.id
            ? { ...u, isArchived: !u.isArchived }
            : u
        )
      );
      setActiveMenuId(null);
      showToast(targetUser.isArchived ? `Restored ${targetUser.fullName}` : `Archived ${targetUser.fullName}`);
    });
  };

  const renderRolePill = (role) => {
    const formattedRole = role.toUpperCase();
    if (formattedRole === 'ADMIN') {
      return (
        <span className="inline-block bg-[#E8C27B] text-[#5A3810] text-[11px] font-extrabold tracking-wider uppercase px-4 py-1 rounded-full shadow-2xs border border-[#D8B066]">
          ADMIN
        </span>
      );
    }
    return (
      <span className="inline-block bg-[#FDEBB6] text-[#8C6D23] text-[11px] font-extrabold tracking-wider uppercase px-4 py-1 rounded-full shadow-2xs border border-[#F3DE9F]">
        STAFF
      </span>
    );
  };

  return (
    <div className="w-full space-y-6 text-[#443523] pb-6">
      
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-[#3A342B] text-[#F5F1EA] px-4 py-3 rounded-xl shadow-xl border border-[#C5A059]/40 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-[#C5A059]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header matching dashboard format with original text */}
      <div>
        <h1 className="text-xl font-bold text-[#2A1E1B]">User Management</h1>
        <p className="text-xs text-[#8A8174]">Manage system admin & staff access, roles, and active credentials</p>
      </div>

      {/* Main Workspace Card */}
      <div className="bg-white rounded-2xl border border-[#E9E4D8] shadow-sm p-6 sm:p-8 space-y-6">
        
        {/* Top Controls Bar with Active / Archived Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#2A1E1B]">All users</h2>
              <span className="bg-[#3A342B] text-[#F5F1EA] text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                {tabFilteredUsers.length}
              </span>
            </div>

            {/* Active Users vs Archived Users Tabs */}
            <div className="flex items-center bg-[#F6F4EF] p-1 rounded-xl border border-[#E9E4D8] ml-2">
              <button
                onClick={() => { setActiveTab('ACTIVE'); setCurrentPage(1); setSelectedUserIds([]); setActiveMenuId(null); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'ACTIVE' 
                    ? 'bg-[#3A342B] text-[#F5F1EA] shadow-xs' 
                    : 'text-[#8A8174] hover:text-[#2A1E1B]'
                }`}
              >
                Active Users
              </button>
              <button
                onClick={() => { setActiveTab('ARCHIVED'); setCurrentPage(1); setSelectedUserIds([]); setActiveMenuId(null); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'ARCHIVED' 
                    ? 'bg-[#3A342B] text-[#F5F1EA] shadow-xs' 
                    : 'text-[#8A8174] hover:text-[#2A1E1B]'
                }`}
              >
                Archived Users
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A8174]" />
              <input
                type="text"
                placeholder="Search Here..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs text-[#2A1E1B] placeholder-[#8A8174] outline-none focus:border-[#C5A059] transition-all"
              />
            </div>

            <div className="relative">
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                className="appearance-none pl-9 pr-8 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs font-semibold text-[#443523] outline-none cursor-pointer focus:border-[#C5A059]"
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="STAFF">Staff</option>
              </select>
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8A8174] pointer-events-none" />
            </div>

            <button
              onClick={() => setIsAddUserOpen(true)}
              className="flex items-center gap-2 bg-[#3A342B] hover:bg-[#2A241B] text-[#F5F1EA] px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95 border border-[#C5A059]/30"
            >
              <Plus className="h-4 w-4 text-[#C5A059]" />
              <span>Add User</span>
            </button>
          </div>
        </div>

        {/* User Table with overflow-visible to prevent clipping */}
        <div className="overflow-x-auto overflow-y-visible rounded-xl border border-[#E9E4D8]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FFFDF8] border-b border-[#E9E4D8] text-[10px] font-semibold text-[#9A907F] uppercase tracking-wider">
                <th className="p-4 pl-5 w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedUserIds.length === paginatedUsers.length && paginatedUsers.length > 0}
                    className="rounded border-[#E9E4D8] text-[#3A342B] focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Account Status</th>
                <th className="p-4">Date Created</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9E4D8] text-xs">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-[#8A8174]">
                    No {activeTab.toLowerCase()} users found.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u, index) => {
                  const isSelected = selectedUserIds.includes(u.id);
                  const isEditing = editingUserId === u.id;
                  const isBottomRow = index >= paginatedUsers.length - 2;

                  if (isEditing) {
                    return (
                      <tr key={u.id} className="bg-[#FFFDF5] border-b border-[#E9E4D8]">
                        <td colSpan="6" className="p-5">
                          <div className="space-y-4 max-w-2xl bg-white p-5 rounded-2xl border border-[#E9E4D8] shadow-sm">
                            <div className="flex items-center justify-between border-b border-[#E9E4D8] pb-3">
                              <h3 className="text-xs font-bold uppercase tracking-wider text-[#3A2E2B]">Edit Profile - {u.role.toLowerCase()}</h3>
                              <button onClick={() => setEditingUserId(null)} className="text-[#8A8174] hover:text-[#2A1E1B]">
                                <X className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">First Name</label>
                                <input
                                  type="text"
                                  value={editForm.firstName}
                                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl border border-[#E9E4D8] bg-white text-xs outline-none focus:border-[#C5A059]"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Last Name</label>
                                <input
                                  type="text"
                                  value={editForm.lastName}
                                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl border border-[#E9E4D8] bg-white text-xs outline-none focus:border-[#C5A059]"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Email Address</label>
                                <input
                                  type="email"
                                  value={editForm.email}
                                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl border border-[#E9E4D8] bg-white text-xs outline-none focus:border-[#C5A059]"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Contact Number</label>
                                <input
                                  type="text"
                                  value={editForm.contactNumber}
                                  onChange={(e) => setEditForm({ ...editForm, contactNumber: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl border border-[#E9E4D8] bg-white text-xs outline-none focus:border-[#C5A059]"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                              <button
                                onClick={() => setEditingUserId(null)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8A8174] hover:bg-[#F6F4EF]"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => {
                                  requestAdminPin(() => {
                                    const fullName = `${editForm.firstName} ${editForm.lastName}`.trim();
                                    setUsers(users.map(item => item.id === u.id ? { ...item, ...editForm, fullName } : item));
                                    setEditingUserId(null);
                                    showToast(`Successfully updated profile for ${fullName}`);
                                  });
                                }}
                                className="px-5 py-2 rounded-xl bg-[#4A3928] hover:bg-[#3A2E2B] text-white text-xs font-bold shadow-md"
                              >
                                Save Changes
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr 
                      key={u.id} 
                      className={`hover:bg-[#C5A059]/5 transition-colors ${isSelected ? 'bg-[#FFFDF0]' : ''}`}
                    >
                      <td className="p-4 pl-5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectUser(u.id)}
                          className="rounded border-[#E9E4D8] text-[#3A342B] focus:ring-0 cursor-pointer"
                        />
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${u.avatarColor} text-white font-bold flex items-center justify-center text-xs shrink-0 border border-white shadow-xs`}>
                            {u.fullName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-[#2A1E1B] truncate">{u.fullName}</p>
                            <p className="text-[11px] text-[#8A8174] truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">{renderRolePill(u.role)}</td>

                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-3.5 py-1 rounded-full ${
                          u.status === 'ACTIVE' 
                            ? 'bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]' 
                            : 'bg-[#FCE8E6] text-[#C5221F] border border-[#FAD2CF]'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'ACTIVE' ? 'bg-[#137333]' : 'bg-[#C5221F]'}`} />
                          {u.status}
                        </span>
                      </td>

                      <td className="p-4 text-[#8A8174] font-medium">{u.dateCreated}</td>

                      <td className="p-4 text-right pr-6 relative">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === u.id ? null : u.id)}
                          className="p-2 rounded-lg hover:bg-[#E9E4D8]/50 text-[#8A8174] hover:text-[#2A1E1B] transition-colors"
                          title="Actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>

                        {activeMenuId === u.id && (
                          <div className={`absolute right-6 w-52 bg-white rounded-xl shadow-xl border border-[#E9E4D8] py-1.5 z-40 text-left animate-fadeIn ${
                            isBottomRow ? 'bottom-12' : 'top-12'
                          }`}>
                            
                            <button
                              onClick={() => {
                                setEditingUserId(u.id);
                                setEditForm({
                                  firstName: u.firstName || u.fullName.split(' ')[0] || '',
                                  lastName: u.lastName || u.fullName.split(' ').slice(1).join(' ') || '',
                                  email: u.email,
                                  contactNumber: u.contactNumber || '0912345678',
                                });
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3.5 py-2 text-xs text-[#2A1E1B] hover:bg-[#FFFDF8] flex items-center gap-2 font-medium"
                            >
                              <Edit3 className="h-3.5 w-3.5 text-[#8A8174]" />
                              Edit Details
                            </button>

                            <div className="px-3.5 py-1.5">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Change Role To:</p>
                              <div className="grid grid-cols-2 gap-1">
                                {['STAFF', 'ADMIN'].map((r) => (
                                  u.role !== r && (
                                    <button
                                      key={r}
                                      onClick={() => handleRoleChange(u, r)}
                                      className="text-[9px] font-bold bg-[#F6F4EF] hover:bg-[#E8D9C2] text-[#443523] py-1 rounded-md text-center transition-colors"
                                    >
                                      {r}
                                    </button>
                                  )
                                ))}
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                requestAdminPin(() => {
                                  showToast(`Password reset link sent to ${u.email}`);
                                });
                              }}
                              className="w-full px-3.5 py-2 text-xs text-[#2A1E1B] hover:bg-[#FFFDF8] flex items-center gap-2 font-medium border-t border-[#E9E4D8]"
                            >
                              <KeyRound className="h-3.5 w-3.5 text-[#B4833F]" />
                              Reset Password Email
                            </button>

                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`w-full px-3.5 py-2 text-xs flex items-center gap-2 font-semibold border-t border-[#E9E4D8] ${
                                u.status === 'ACTIVE' ? 'text-red-600 hover:bg-red-50' : 'text-emerald-700 hover:bg-emerald-50'
                              }`}
                            >
                              {u.status === 'ACTIVE' ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                              {u.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
                            </button>

                            <button
                              onClick={() => handleToggleArchive(u)}
                              className="w-full px-3.5 py-2 text-xs text-[#8C6D23] hover:bg-[#FFFDF3] flex items-center gap-2 font-semibold border-t border-[#E9E4D8]"
                            >
                              {u.isArchived ? <RotateCcw className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                              {u.isArchived ? 'Restore Account' : 'Archive Account'}
                            </button>

                          </div>
                        )}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination / Switch Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-[#8A8174] pt-1 gap-3">
          <span>Showing {paginatedUsers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} items</span>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] disabled:opacity-40 hover:bg-[#F6F4EF] transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-semibold px-2 text-[#443523]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] disabled:opacity-40 hover:bg-[#F6F4EF] transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>

      {/* ================= MODAL: ADMIN PIN CONFIRMATION ================= */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-[60] animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E9E4D8] shadow-2xl w-full max-w-sm p-6 space-y-5 text-center">
            
            <div className="w-12 h-12 bg-[#FFFDF3] border border-[#E9DCB3] text-[#B4833F] rounded-full flex items-center justify-center mx-auto shadow-xs">
              <Lock className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-[#2A1E1B]">Admin Authorization</h3>
              <p className="text-xs text-[#8A8174] mt-1">Please enter your 4-digit Admin PIN to confirm this action.</p>
            </div>

            <form onSubmit={handleVerifyPinSubmit} className="space-y-4">
              <input
                type="password"
                maxLength={6}
                autoFocus
                placeholder="••••"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                className="w-full text-center tracking-[0.5em] text-lg font-bold px-4 py-3 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] outline-none focus:border-[#C5A059]"
              />

              {pinError && <p className="text-xs text-red-600 font-medium">{pinError}</p>}
              <p className="text-[10px] text-[#8A8174]">Hint: Test PIN is <span className="font-mono font-bold text-[#443523]">1234</span></p>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-[#5C524B] bg-[#EFECE6] hover:bg-[#E4E0D8] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#4A3928] hover:bg-[#3A2E2B] text-white text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  Confirm PIN
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL: ADD USER */}
      {isAddUserOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-[#E9E4D8] shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E9E4D8] pb-3">
              <h3 className="text-base font-bold text-[#2A1E1B]">Create System User Account</h3>
              <button onClick={() => setIsAddUserOpen(false)} className="text-[#8A8174] hover:text-[#2A1E1B]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Millicent"
                    value={newUserForm.firstName}
                    onChange={(e) => setNewUserForm({ ...newUserForm, firstName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs outline-none focus:border-[#C5A059]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Campillo"
                    value={newUserForm.lastName}
                    onChange={(e) => setNewUserForm({ ...newUserForm, lastName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="admin@centyzz.com"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Role Assignment</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs font-semibold text-[#443523] outline-none focus:border-[#C5A059]"
                >
                  <option value="STAFF">STAFF</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#8A8174] hover:bg-[#F6F4EF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#3A342B] hover:bg-[#2A241B] text-[#F5F1EA] text-xs font-bold shadow-md border border-[#C5A059]/30"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}