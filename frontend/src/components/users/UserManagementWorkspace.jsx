import HeaderActions from '../workspace/HeaderActions';
import { api, readJsonResponse } from '../../api/client.js';
import { useState, useEffect } from 'react';
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
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react';

// The credentials are shown once, so copy them without putting them in storage.
function CredentialCopyValue({ value, label, copied, onCopy, mono = false }) {
  return (
    <span className="group inline-flex min-w-0 max-w-full items-center gap-1.5 align-middle">
      <span className={`min-w-0 break-all font-bold ${mono ? 'font-mono' : ''}`}>{value}</span>
      <button
        type="button"
        aria-label={`Copy ${label}`}
        title={copied ? 'Copied!' : `Copy ${label}`}
        onClick={() => onCopy(label, value)}
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[#736457] opacity-50 transition-all hover:bg-[#F1ECE4] hover:text-[#2A1E1B] focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#A87C43] sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </span>
  );
}

// Shared PRESENTATION and UI behavior only. Each role supplies its own API namespace.
export default function UserManagementWorkspace({ currentUser, showHeaderActions = true, apiBase, visibleRoles }) {
  const allowedRoles = visibleRoles || ['ADMIN', 'STAFF'];
  const loggedInRole = (currentUser?.role || 'ADMIN').toUpperCase();
  const loggedInEmail = currentUser?.email || 'admin@centyzz.com';

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

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
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [copiedCredentialField, setCopiedCredentialField] = useState(null);

  const [toastMessage, setToastMessage] = useState('');

  const [newUserForm, setNewUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'STAFF',
    tempPassword: '',
  });

  const getAuthToken = () => currentUser?.accessToken || '';

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleCopyCredential = async (field, value) => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(value);
      setCopiedCredentialField(field);
      setTimeout(() => setCopiedCredentialField((current) => current === field ? null : current), 1800);
    } catch {
      showToast('Could not copy automatically. Please select and copy the value manually.');
    }
  };

  // Fetch through the page-specific namespace. Admin and Superadmin never call each other's URLs.
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setLoadError('');
      try {
        const response = await fetch(`${apiBase}?archived=${activeTab === 'ARCHIVED'}`, {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
        const result = await readJsonResponse(response);
        if (!response.ok) throw new Error(Array.isArray(result.message) ? result.message.join(' ') : result.message || 'Unable to load users');
        if (!Array.isArray(result)) throw new Error('Unexpected user data returned by the server');
        if (active) setUsers(result);
      } catch (error) {
        if (active) { setUsers([]); setLoadError(error.message || 'Unable to load users'); }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [activeTab, apiBase, currentUser?.accessToken]);

  const refreshUsers = async () => {
    try {
      const response = await fetch(`${apiBase}?archived=${activeTab === 'ARCHIVED'}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      const result = await readJsonResponse(response);
      if (!response.ok) throw new Error(Array.isArray(result.message) ? result.message.join(' ') : result.message || 'Unable to refresh users');
      if (!Array.isArray(result)) throw new Error('Unexpected user data returned by the server');
      setUsers(result);
      setLoadError('');
    } catch (error) {
      showToast(error.message || 'Unable to refresh users');
    }
  };

  const requestAdminPin = (actionCallback) => {
    setPendingAction(() => actionCallback);
    setAdminPin('');
    setPinError('');
    setIsPinModalOpen(true);
  };

  const handleVerifyPinSubmit = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(adminPin)) {
      setPinError('Enter your six-digit management PIN.');
      return;
    }
    try {
      await api.verifyActionPin(getAuthToken(), adminPin);
      setIsPinModalOpen(false);
      const action = pendingAction;
      setPendingAction(null);
      if (action) await action(adminPin);
    } catch (error) {
      setPinError(error.message || 'Management PIN verification failed.');
    } finally {
      setAdminPin('');
    }
  };

  // Backend filters Active vs Archived via ?archived=true/false
  const tabFilteredUsers = users;

 const filteredUsers = tabFilteredUsers
    .filter((u) => {
      // Role scope is enforced by the backend; mirror it here for a consistent table.
      if (!allowedRoles.includes(String(u.role || '').toUpperCase())) return false;

      const matchesSearch = 
        (u.fullName || `${u.firstName || ''} ${u.lastName || ''}`).toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      // Priority 0: Currently logged-in admin always comes first
      const isASelf = a.email === loggedInEmail;
      const isBSelf = b.email === loggedInEmail;
      if (isASelf && !isBSelf) return -1;
      if (!isASelf && isBSelf) return 1;

      // Priority 1: Other ADMIN accounts, Priority 2: STAFF
      const roleOrder = { SUPERADMIN: 1, ADMIN: 2, STAFF: 3 };
      const orderA = roleOrder[a.role] || 4;
      const orderB = roleOrder[b.role] || 4;

      if (orderA !== orderB) return orderA - orderB;
      return (a.fullName || a.email).localeCompare(b.fullName || b.email);
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

  // -------------------------------------------------------------
  // API ACTION: Add New System User
  // -------------------------------------------------------------
  const handleAddUserSubmit = (e) => {
    e.preventDefault();
    if (!newUserForm.firstName || !newUserForm.email) return;

    requestAdminPin(async (verifiedPin) => {
      try {
        const response = await fetch(apiBase, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'X-Management-Pin': verifiedPin,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newUserForm),
        });

        if (response.ok) {
          const result = await response.json();
          if (!result.temporaryPassword || !result.temporaryPin) throw new Error('Account created but temporary credentials were not returned. Contact the system administrator.');
          setCopiedCredentialField(null);
          setCreatedCredentials({ email: result.email, password: result.temporaryPassword, pin: result.temporaryPin });
          setIsAddUserOpen(false);
          setNewUserForm({ firstName: '', lastName: '', email: '', role: 'STAFF', tempPassword: '' });
          refreshUsers();
          showToast(`Successfully created account for ${newUserForm.firstName} ${newUserForm.lastName}`);
        } else {
          const errData = await response.json();
          showToast(errData.message || 'Failed to create user account');
        }
      } catch (err) {
        console.error('Error creating user:', err);
      }
    });
  };

  // -------------------------------------------------------------
  // API ACTION: Save Edited Profile
  // -------------------------------------------------------------
  const handleSaveEditProfile = (u) => {
    requestAdminPin(async (verifiedPin) => {
      try {
        const response = await fetch(`${apiBase}/${u.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'X-Management-Pin': verifiedPin,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editForm),
        });

        if (response.ok) {
          setEditingUserId(null);
          refreshUsers();
          showToast(`Successfully updated profile for ${editForm.firstName} ${editForm.lastName}`);
        } else {
          showToast('Failed to update user profile');
        }
      } catch (err) {
        console.error('Error updating user:', err);
      }
    });
  };

  // -------------------------------------------------------------
  // API ACTION: Change User Role
  // -------------------------------------------------------------
  const handleRoleChange = (targetUser, newRole) => {
    requestAdminPin(async (verifiedPin) => {
      try {
        const response = await fetch(`${apiBase}/${targetUser.id}/role`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'X-Management-Pin': verifiedPin,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role: newRole }),
        });

        if (response.ok) {
          setActiveMenuId(null);
          refreshUsers();
          showToast(`Successfully changed ${targetUser.fullName}'s role to ${newRole}`);
        } else {
          showToast('Failed to change user role');
        }
      } catch (err) {
        console.error('Error updating role:', err);
      }
    });
  };

  // -------------------------------------------------------------
  // API ACTION: Toggle Active/Inactive Status
  // -------------------------------------------------------------
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

    requestAdminPin(async (verifiedPin) => {
      try {
        const response = await fetch(`${apiBase}/${targetUser.id}/status`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'X-Management-Pin': verifiedPin,
          },
        });

        if (response.ok) {
          setActiveMenuId(null);
          refreshUsers();
          showToast(`Updated ${targetUser.fullName}'s status`);
        } else {
          showToast('Failed to toggle status');
        }
      } catch (err) {
        console.error('Error toggling status:', err);
      }
    });
  };

  // -------------------------------------------------------------
  // API ACTION: Toggle Archive/Restore
  // -------------------------------------------------------------
  const handleToggleArchive = (targetUser) => {
    if (targetUser.email === loggedInEmail && !targetUser.isArchived) {
      showToast('Action restricted: You cannot archive your own active account.');
      setActiveMenuId(null);
      return;
    }

    requestAdminPin(async (verifiedPin) => {
      try {
        const response = await fetch(`${apiBase}/${targetUser.id}/archive`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'X-Management-Pin': verifiedPin,
          },
        });

        if (response.ok) {
          setActiveMenuId(null);
          refreshUsers();
          showToast(targetUser.isArchived ? `Restored ${targetUser.fullName}` : `Archived ${targetUser.fullName}`);
        } else {
          showToast('Failed to archive user');
        }
      } catch (err) {
        console.error('Error toggling archive:', err);
      }
    });
  };

  const renderRolePill = (role) => {
    const formattedRole = (role || '').toUpperCase();
    if (formattedRole === 'SUPERADMIN') return (
      <span className="inline-block bg-[#493525] text-[#FFE6B0] text-[11px] font-extrabold tracking-wider uppercase px-4 py-1 rounded-full shadow-2xs border border-[#C5A059]">SUPERADMIN</span>
    );
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

      {/* Header Bar */}
      <header className="mb-6 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-[#2A1E1B]">User Management</h1>
          <p className="text-xs text-[#8A8174]">Manage system admin & staff access, roles, and active credentials</p>
        </div>

        {/* System Quick Actions */}
        {showHeaderActions && (<HeaderActions />)}
      </header>

      {/* Main Workspace Card */}
      <div className="bg-white rounded-2xl border border-[#E9E4D8] shadow-sm p-6 sm:p-8 space-y-6">
        
        {/* Top Controls Bar */}
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
                {allowedRoles.map((role) => <option key={role} value={role}>{role === 'SUPERADMIN' ? 'Superadmin' : role === 'ADMIN' ? 'Admin' : 'Staff'}</option>)}
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

        {/* User Table */}
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
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-[#8A8174]">
                    Loading user records from Neon DB...
                  </td>
                </tr>
              ) : loadError ? (
                <tr><td colSpan="6" role="alert" className="p-8 text-center text-red-700">{loadError}</td></tr>
              ) : paginatedUsers.length === 0 ? (
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

                  const isTargetAdmin = u.role === 'ADMIN' || u.role === 'SUPERADMIN';
                  const isSelf = u.email === loggedInEmail;
                  const isActionRestricted = u.role === 'SUPERADMIN' || (loggedInRole === 'ADMIN' && isTargetAdmin && !isSelf);

                  if (isEditing) {
                    return (
                      <tr key={u.id} className="bg-[#FFFDF5] border-b border-[#E9E4D8]">
                        <td colSpan="6" className="p-5">
                          <div className="space-y-4 max-w-2xl bg-white p-5 rounded-2xl border border-[#E9E4D8] shadow-sm">
                            <div className="flex items-center justify-between border-b border-[#E9E4D8] pb-3">
                              <h3 className="text-xs font-bold uppercase tracking-wider text-[#3A2E2B]">Edit Profile - {u.role?.toLowerCase()}</h3>
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
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                              <button
                                onClick={() => setEditingUserId(null)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8A8174] hover:bg-[#F6F4EF]"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveEditProfile(u)}
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
                          <div className={`w-9 h-9 rounded-full ${u.avatarColor || 'bg-[#4A3928]'} text-white font-bold flex items-center justify-center text-xs shrink-0 border border-white shadow-xs`}>
                            {(u.firstName || u.fullName || 'U').charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-[#2A1E1B] truncate">{u.fullName || `${u.firstName || ''} ${u.lastName || ''}`}</p>
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
                          <div className={`absolute right-6 w-56 bg-white rounded-xl shadow-xl border border-[#E9E4D8] py-1.5 z-40 text-left animate-fadeIn ${
                            isBottomRow ? 'bottom-12' : 'top-12'
                          }`}>
                            
                            {isActionRestricted ? (
                              <div className="p-3 bg-[#F9F8F6] rounded-lg mx-1.5 border border-[#E9E4D8]">
                                <div className="flex items-center gap-1.5 text-[#5C524B] font-bold text-xs mb-1">
                                  <Lock className="h-3.5 w-3.5 text-[#C5A059]" /> 
                                  <span>Protected Account</span>
                                </div>
                                <p className="text-[10px] text-[#8A8174] leading-relaxed">
                                  {u.role === 'SUPERADMIN' ? 'Superadmin accounts are protected. Use Account Settings to manage your own profile.' : 'Admin profiles are read-only and cannot be modified by peer Admins.'}
                                </p>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingUserId(u.id);
                                    setEditForm({
                                      firstName: u.firstName || (u.fullName ? u.fullName.split(' ')[0] : ''),
                                      lastName: u.lastName || (u.fullName ? u.fullName.split(' ').slice(1).join(' ') : ''),
                                      email: u.email,
                                    });
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs text-[#2A1E1B] hover:bg-[#FFFDF8] flex items-center gap-2 font-medium"
                                >
                                  <Edit3 className="h-3.5 w-3.5 text-[#8A8174]" />
                                  Edit Details
                                </button>

                                <div className="px-3.5 py-1.5 border-t border-[#E9E4D8]">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Change Role To:</p>
                                  <div className="grid grid-cols-2 gap-1">
                                    {['STAFF', 'ADMIN'].map((r) => {
                                      const isCurrentRole = u.role === r;
                                      return (
                                        <button
                                          key={r}
                                          disabled={isCurrentRole || loggedInRole !== 'SUPERADMIN'}
                                          title={loggedInRole !== 'SUPERADMIN' ? 'Only Superadmins can change roles' : undefined}
                                          onClick={() => !isCurrentRole && loggedInRole === 'SUPERADMIN' && handleRoleChange(u, r)}
                                          className={`text-[9px] font-bold py-1 rounded-md text-center transition-colors ${
                                            isCurrentRole 
                                              ? 'bg-[#EFECE6] text-[#A0988C] cursor-not-allowed opacity-60' 
                                              : 'bg-[#F6F4EF] hover:bg-[#E8D9C2] text-[#443523]'
                                          }`}
                                        >
                                          {r} {isCurrentRole ? '✓' : ''}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    requestAdminPin(() => {
                                      showToast('No email was sent. Ask the user to use Forgot Password on the login page.');
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
                              </>
                            )}

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

        {/* Pagination Footer */}
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

      {/* MODAL: ADMIN PIN CONFIRMATION */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-[60] animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E9E4D8] shadow-2xl w-full max-w-sm p-6 space-y-5 text-center">
            
            <div className="w-12 h-12 bg-[#FFFDF3] border border-[#E9DCB3] text-[#B4833F] rounded-full flex items-center justify-center mx-auto shadow-xs">
              <Lock className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-[#2A1E1B]">Management Authorization</h3>
              <p className="text-xs text-[#8A8174] mt-1">Enter your six-digit management PIN to confirm this action.</p>
            </div>

            <form onSubmit={handleVerifyPinSubmit} className="space-y-4">
              <input
                type="password"
                maxLength={6}
                autoFocus
                placeholder="••••••"
                inputMode="numeric"
                pattern="[0-9]{6}"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, '').slice(0,6))}
                className="w-full text-center tracking-[0.5em] text-lg font-bold px-4 py-3 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] outline-none focus:border-[#C5A059]"
              />

              {pinError && <p className="text-xs text-red-600 font-medium">{pinError}</p>}
              <p className="text-[10px] text-[#8A8174]">Your management PIN is verified against your account, not a shared test code.</p>

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

      {createdCredentials && (
        <div role="dialog" aria-modal="true" aria-label="One-time management credentials" className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 text-[#2A1E1B] shadow-2xl">
            <h3 className="text-lg font-bold">Account created — save credentials now</h3>
            <p className="text-sm">These initial credentials are shown only once. The temporary PIN is unique to this account; the initial password may be shared across newly created accounts. Share both securely. The user must change their password, PIN, name and phone number at first login.</p>
            <p className="text-sm leading-relaxed">Email: <CredentialCopyValue label="email" value={createdCredentials.email} copied={copiedCredentialField === 'email'} onCopy={handleCopyCredential} /></p>
            <p className="text-sm leading-relaxed">Temporary password: <CredentialCopyValue label="password" mono value={createdCredentials.password} copied={copiedCredentialField === 'password'} onCopy={handleCopyCredential} /></p>
            <p className="text-sm leading-relaxed">Temporary PIN: <CredentialCopyValue label="PIN" mono value={createdCredentials.pin} copied={copiedCredentialField === 'PIN'} onCopy={handleCopyCredential} /></p>
            <button type="button" onClick={() => setCreatedCredentials(null)} className="rounded-lg bg-[#3A342B] px-4 py-2 text-sm text-white">I've saved these credentials</button>
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