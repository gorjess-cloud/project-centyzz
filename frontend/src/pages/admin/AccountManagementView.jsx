import { useState } from 'react';
import { 
  User, 
  Lock, 
  KeyRound, 
  ShieldCheck, 
  CheckCircle2, 
  Moon, 
  Search, 
  Bell, 
  Save, 
  Camera,
  Smartphone,
  History
} from 'lucide-react';

export default function AccountManagementView({ currentUser }) {
  const [toastMessage, setToastMessage] = useState('');

  // Active sub-tab state
  const [activeTab, setActiveTab] = useState('PROFILE'); // 'PROFILE', 'SECURITY', 'LOGS'

  // Personal Profile Form State
  const [profileForm, setProfileForm] = useState({
    firstName: currentUser?.firstName || 'Millicent',
    lastName: currentUser?.lastName || 'Campillos',
    email: currentUser?.email || 'MillicentCampillos@example.com',
    contactNumber: currentUser?.contactNumber || '0912345678',
    role: currentUser?.role || 'ADMIN',
    avatarUrl: currentUser?.avatarUrl || ''
  });

  // Password Update Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Admin Security PIN State
  const [pinForm, setPinForm] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: ''
  });

  // Mock Activity Logs
  const [activityLogs] = useState([
    { id: 'log_1', action: 'Password updated', ip: '192.168.1.15', device: 'Chrome / Windows', timestamp: 'Today, 10:42 AM' },
    { id: 'log_2', action: 'Admin PIN verification', ip: '192.168.1.15', device: 'Chrome / Windows', timestamp: 'Yesterday, 03:15 PM' },
    { id: 'log_3', action: 'Logged in to system', ip: '192.168.1.15', device: 'Chrome / Windows', timestamp: 'Oct 20, 2026, 08:30 AM' },
    { id: 'log_4', action: 'Profile details updated', ip: '192.168.1.18', device: 'Safari / macOS', timestamp: 'Sep 15, 2026, 02:10 PM' }
  ]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    showToast('Successfully updated profile details!');
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('Error: New passwords do not match.');
      return;
    }
    showToast('Password successfully changed!');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handlePinChange = (e) => {
    e.preventDefault();
    if (pinForm.newPin !== pinForm.confirmPin) {
      showToast('Error: New PIN entries do not match.');
      return;
    }
    showToast('Admin PIN updated successfully!');
    setPinForm({ currentPin: '', newPin: '', confirmPin: '' });
  };

  const initials = `${profileForm.firstName.charAt(0)}${profileForm.lastName.charAt(0)}`.toUpperCase();

  return (
    <div className="w-full space-y-6 text-[#443523] pb-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-[#3A342B] text-[#F5F1EA] px-4 py-3 rounded-xl shadow-xl border border-[#C5A059]/40 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-[#C5A059]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <header className="mb-6 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-[#2A1E1B]">Account Settings</h1>
          <p className="text-xs text-[#8A8174]">Manage your personal credentials, contact info, security credentials, and login history</p>
        </div>

        {/* System Quick Actions */}
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

      {/* Profile Overview Header Card */}
      <div className="bg-white rounded-2xl border border-[#E9E4D8] shadow-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative group cursor-pointer">
            <div className="w-20 h-20 rounded-full bg-[#4A3928] text-[#C5A059] font-bold text-2xl border-4 border-[#C5A059]/30 flex items-center justify-center shadow-md overflow-hidden">
              {profileForm.avatarUrl ? (
                <img src={profileForm.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#2A1E1B]">{profileForm.firstName} {profileForm.lastName}</h2>
              <span className="bg-[#E8C27B] text-[#5A3810] text-[10px] font-extrabold tracking-wider uppercase px-3 py-0.5 rounded-full border border-[#D8B066]">
                {profileForm.role}
              </span>
            </div>
            <p className="text-xs text-[#8A8174] mt-0.5">{profileForm.email}</p>
            <p className="text-[11px] text-[#443523] mt-1 font-medium">Contact: {profileForm.contactNumber}</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-[#F6F4EF] p-1.5 rounded-xl border border-[#E9E4D8] self-stretch sm:self-auto justify-center">
          <button
            onClick={() => setActiveTab('PROFILE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'PROFILE'
                ? 'bg-[#3A342B] text-[#F5F1EA] shadow-xs'
                : 'text-[#8A8174] hover:text-[#2A1E1B]'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            Profile Info
          </button>
          <button
            onClick={() => setActiveTab('SECURITY')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'SECURITY'
                ? 'bg-[#3A342B] text-[#F5F1EA] shadow-xs'
                : 'text-[#8A8174] hover:text-[#2A1E1B]'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Security & PIN
          </button>
          <button
            onClick={() => setActiveTab('LOGS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'LOGS'
                ? 'bg-[#3A342B] text-[#F5F1EA] shadow-xs'
                : 'text-[#8A8174] hover:text-[#2A1E1B]'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            Activity
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="bg-white rounded-2xl border border-[#E9E4D8] shadow-sm p-6 sm:p-8 space-y-6">

        {/* TAB 1: PERSONAL PROFILE */}
        {activeTab === 'PROFILE' && (
          <form onSubmit={handleProfileSave} className="space-y-6 max-w-3xl">
            <div>
              <h3 className="text-sm font-bold text-[#2A1E1B] uppercase tracking-wider mb-1">Personal Details</h3>
              <p className="text-xs text-[#8A8174]">Update your basic profile information used across system communications</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs font-medium text-[#2A1E1B] outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs font-medium text-[#2A1E1B] outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs font-medium text-[#2A1E1B] outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Contact Number</label>
                <input
                  type="text"
                  required
                  value={profileForm.contactNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, contactNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs font-medium text-[#2A1E1B] outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Assigned System Role</label>
              <input
                type="text"
                readOnly
                value={profileForm.role}
                className="w-full sm:w-1/2 px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#F6F4EF] text-xs font-bold text-[#8A8174] cursor-not-allowed"
              />
              <p className="text-[10px] text-[#8A8174] mt-1">Role assignments can only be modified by Superadmin accounts.</p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 bg-[#3A342B] hover:bg-[#2A241B] text-[#F5F1EA] px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 border border-[#C5A059]/30"
              >
                <Save className="h-4 w-4 text-[#C5A059]" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: SECURITY & PIN */}
        {activeTab === 'SECURITY' && (
          <div className="space-y-8 max-w-3xl">
            {/* Update Password Form */}
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#2A1E1B] uppercase tracking-wider mb-1 flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-[#C5A059]" /> Change Password
                </h3>
                <p className="text-xs text-[#8A8174]">Ensure your account is using a long, random password to stay secure.</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full sm:w-2/3 px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:w-2/3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="bg-[#3A342B] hover:bg-[#2A241B] text-[#F5F1EA] px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 border border-[#C5A059]/30"
              >
                Update Password
              </button>
            </form>

            <hr className="border-[#E9E4D8]" />

            {/* Admin Verification PIN */}
            <form onSubmit={handlePinChange} className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#2A1E1B] uppercase tracking-wider mb-1 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[#C5A059]" /> Admin Security PIN
                </h3>
                <p className="text-xs text-[#8A8174]">This 4-digit PIN is required when performing high-security actions (e.g., adding users, deactivating accounts).</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:w-3/4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Current PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={pinForm.currentPin}
                    onChange={(e) => setPinForm({ ...pinForm, currentPin: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs text-center font-bold tracking-[0.3em] outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">New PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={pinForm.newPin}
                    onChange={(e) => setPinForm({ ...pinForm, newPin: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs text-center font-bold tracking-[0.3em] outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Confirm PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={pinForm.confirmPin}
                    onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs text-center font-bold tracking-[0.3em] outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="bg-[#3A342B] hover:bg-[#2A241B] text-[#F5F1EA] px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 border border-[#C5A059]/30"
              >
                Save New PIN
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: ACTIVITY LOGS */}
        {activeTab === 'LOGS' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#2A1E1B] uppercase tracking-wider mb-1">Recent Account Activity</h3>
              <p className="text-xs text-[#8A8174]">Recent login attempts and administrative security actions tied to your credentials</p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#E9E4D8]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FFFDF8] border-b border-[#E9E4D8] text-[10px] font-semibold text-[#9A907F] uppercase tracking-wider">
                    <th className="p-4">Action Event</th>
                    <th className="p-4">IP Address</th>
                    <th className="p-4">Browser & Device</th>
                    <th className="p-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9E4D8] text-xs">
                  {activityLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F6F4EF]/50 transition-colors">
                      <td className="p-4 font-bold text-[#2A1E1B] flex items-center gap-2">
                        <Smartphone className="h-3.5 w-3.5 text-[#C5A059]" />
                        {log.action}
                      </td>
                      <td className="p-4 font-mono text-xs text-[#8A8174]">{log.ip}</td>
                      <td className="p-4 text-[#443523]">{log.device}</td>
                      <td className="p-4 text-[#8A8174]">{log.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}