import AdminPageHeader from '../../components/workspace/AdminPageHeader';
import {adminWorkspaceRequest} from '../../api/admin-workspace';
import PasswordRequirements,{passwordRequirements} from '../../components/PasswordRequirements';
import { api } from '../../api/client.js';
import { useEffect, useRef, useState } from 'react';
import { useUnsavedChanges } from '../../components/UnsavedChangesProvider';
import ProfilePictureModal from '../../components/ProfilePictureModal';
import SaveChangesModal from '../../components/SaveChangesModal';
import { 
  User, 
  Lock, 
  KeyRound, 
  ShieldCheck, 
  CheckCircle2, 
  Save, 
  Camera,
  Smartphone,
  History
} from 'lucide-react';


export default function AccountManagementView({ currentUser, onUserUpdated, showHeaderActions = true }) {
  const [toastMessage, setToastMessage] = useState('');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [pendingSave, setPendingSave] = useState('');
  const { markDirty, markSaved } = useUnsavedChanges();
  const profileScope = `admin-profile-${currentUser?.id || currentUser?.email || 'current'}`;
  const avatarScope = `admin-avatar-${currentUser?.id || currentUser?.email || 'current'}`;
  const passwordScope = `admin-password-${currentUser?.id || currentUser?.email || 'current'}`;
  const pinScope = `admin-pin-${currentUser?.id || currentUser?.email || 'current'}`;

  // Active sub-tab state
  const [activeTab, setActiveTab] = useState('PROFILE'); // 'PROFILE', 'SECURITY', 'LOGS'

  // Personal Profile Form State
  const [profileForm, setProfileForm] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    email: currentUser?.email || '',
    contactNumber: currentUser?.phoneNumber || currentUser?.contactNumber || '',
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

  const [activityLogs,setActivityLogs]=useState(null);
  const [activityError,setActivityError]=useState('');
  const [loadError,setLoadError]=useState('');
  const [busy,setBusy]=useState(false),[showPassword,setShowPassword]=useState(false),[showPin,setShowPin]=useState(false);
  const saving=useRef(false),profileEdited=useRef(false);
  const token=currentUser?.accessToken;
  useEffect(()=>{let active=true;api.getMyProfile(token).then(result=>{if(active&&!profileEdited.current){const u=result.data;setProfileForm({firstName:u.firstName||'',lastName:u.lastName||'',email:u.email||'',contactNumber:u.phoneNumber||'',role:u.role,avatarUrl:u.avatarUrl||''});}}).catch(e=>{if(active)setLoadError(e.message);});return()=>{active=false;};},[token]);
  useEffect(()=>{if(activeTab!=='LOGS')return;let active=true;adminWorkspaceRequest(token,'account/activity').then(rows=>{if(active)setActivityLogs(rows);}).catch(e=>{if(active)setActivityError(e.message);});return()=>{active=false;};},[activeTab,token]);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleAvatarImport = async (imageUrl) => {
    const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('Unable to process this picture.'));img.src=imageUrl;});
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;canvas.getContext('2d').drawImage(image,0,0,256,256);imageUrl=canvas.toDataURL('image/jpeg',0.82);
    if(imageUrl.length>87000)throw new Error('Please choose a smaller picture.');
    profileEdited.current=true;
    markDirty(avatarScope);
    setProfileForm((previous) => ({ ...previous, avatarUrl: imageUrl }));
  };

  const handleAvatarRemove = () => {
    profileEdited.current=true;
    markDirty(avatarScope);
    setProfileForm((previous) => ({ ...previous, avatarUrl: '' }));
  };

  const handleProfileSave = async () => {
    try {
      const result = await api.updateMyProfile(currentUser?.accessToken, {
        firstName: profileForm.firstName, lastName: profileForm.lastName,
        phoneNumber: profileForm.contactNumber, avatarUrl:profileForm.avatarUrl,
      });
      onUserUpdated?.(result.data);
      markSaved(profileScope);
      markSaved(avatarScope);profileEdited.current=false;
      showToast('Successfully updated profile details!');
    } catch (error) { showToast(error.message || 'Unable to update profile'); }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('Error: New passwords do not match.');
      return;
    }
    try {
      const result=await api.changeManagementCredentials(currentUser?.accessToken, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      if(result.data)onUserUpdated?.(result.data);
      showToast('Password successfully changed! Other sessions will need to sign in again.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      markSaved(passwordScope);
    } catch (error) { showToast(error.message || 'Unable to change password'); }
  };

  const handlePinChange = async () => {
    if (pinForm.newPin !== pinForm.confirmPin) {
      showToast('Error: New PIN entries do not match.');
      return;
    }
    try {
      const result=await api.changeManagementCredentials(currentUser?.accessToken, {
        currentPin: pinForm.currentPin,
        newPin: pinForm.newPin,
      });
      if(result.data)onUserUpdated?.(result.data);
      showToast('Management PIN updated successfully! Other sessions will need to sign in again.');
      setPinForm({ currentPin: '', newPin: '', confirmPin: '' });
      markSaved(pinScope);
    } catch (error) { showToast(error.message || 'Unable to change PIN'); }
  };

  const requestSave = (event, action) => {
    event.preventDefault();
    setPendingSave(action);
  };

  const confirmSave = async () => {
    if(saving.current)return;saving.current=true;setBusy(true);const action=pendingSave;setPendingSave('');
    try{if(action==='profile')await handleProfileSave();if(action==='password')await handlePasswordChange();if(action==='pin')await handlePinChange();}finally{saving.current=false;setBusy(false);}
  };

  const initials = `${profileForm.firstName.charAt(0)}${profileForm.lastName.charAt(0)}`.toUpperCase();
  const passwordMismatch = Boolean(passwordForm.confirmPassword)
    && passwordForm.newPassword !== passwordForm.confirmPassword;
  const pinMismatch = Boolean(pinForm.confirmPin)
    && pinForm.newPin !== pinForm.confirmPin;

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
      <AdminPageHeader title="Account Settings" subtitle="Manage your personal credentials, contact info, security credentials, and login history" showHeaderActions={showHeaderActions}/>

      {loadError&&<p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{loadError}</p>}
      {busy&&<p role="status" className="text-sm">Saving account changes…</p>}
      {/* Profile Overview Header Card */}
      <div className="bg-white rounded-2xl border border-[#E9E4D8] shadow-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <button type="button" className="relative group cursor-pointer" onClick={() => setIsAvatarModalOpen(true)} title="Manage profile image" aria-label="Manage profile image">
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
          </button>

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
            onClick={() => {setActivityLogs(null);setActivityError('');setActiveTab('LOGS');}}
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
      <div className="min-h-[700px] bg-white rounded-2xl border border-[#E9E4D8] shadow-sm p-6 sm:p-8 space-y-6">

        {/* TAB 1: PERSONAL PROFILE */}
        {activeTab === 'PROFILE' && (
          <form onSubmit={(event) => requestSave(event, 'profile')} onChange={() => {profileEdited.current=true;markDirty(profileScope);}} className="space-y-6 max-w-3xl">
            <div>
              <h3 className="text-sm font-bold text-[#2A1E1B] uppercase tracking-wider mb-1">Personal Details</h3>
              <p className="text-xs text-[#8A8174]">Update your basic profile information used across system communications</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1" htmlFor="account-field-0">First Name</label>
                <input id="account-field-0"
                  type="text"
                  required
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs font-medium text-[#2A1E1B] outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1" htmlFor="account-field-1">Last Name</label>
                <input id="account-field-1"
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
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1" htmlFor="account-field-2">Email Address</label>
                <p className="mb-2 text-[10px] text-[#8A8174]">Your sign-in email is managed in Users.</p>
                <input id="account-field-2"
                  type="email"
                  required
                  value={profileForm.email}
                  readOnly aria-readonly="true"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs font-medium text-[#2A1E1B] outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1" htmlFor="account-field-3">Contact Number</label>
                <input id="account-field-3"
                  type="text"
                  maxLength={20}
                  value={profileForm.contactNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, contactNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs font-medium text-[#2A1E1B] outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1" htmlFor="account-field-4">Assigned System Role</label>
              <input id="account-field-4"
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
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={showPassword} onChange={e=>setShowPassword(e.target.checked)}/>Show passwords</label>
            {/* Update Password Form */}
            <form onSubmit={(event) => requestSave(event, 'password')} onChange={() => markDirty(passwordScope)} className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#2A1E1B] uppercase tracking-wider mb-1 flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-[#C5A059]" /> Change Password
                </h3>
                <p className="text-xs text-[#8A8174]">Ensure your account is using a long, random password to stay secure.</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1" htmlFor="account-field-5">Current Password</label>
                <input id="account-field-5"
                  type={showPassword?"text":"password"}
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full sm:w-2/3 px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:w-2/3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1" htmlFor="account-field-6">New Password</label>
                  <input id="account-field-6"
                    type={showPassword?"text":"password"}
                    required
                    minLength={12} maxLength={128} autoComplete="new-password"
                    value={passwordForm.newPassword}
                    onChange={(e) => {
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs outline-none focus:border-[#C5A059]"
                  />
                  <div className="mt-3"><PasswordRequirements value={passwordForm.newPassword}/></div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1" htmlFor="account-field-7">Confirm New Password</label>
                  <input id="account-field-7"
                    type={showPassword?"text":"password"}
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs outline-none focus:border-[#C5A059]"
                  />
                  {passwordMismatch && <p className="mt-1 text-[11px] text-red-600">Passwords do not match.</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={busy || passwordMismatch || !passwordRequirements(passwordForm.newPassword).every(rule=>rule.met)}
                className="bg-[#3A342B] hover:bg-[#2A241B] text-[#F5F1EA] px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 border border-[#C5A059]/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Update Password
              </button>
            </form>

            <hr className="border-[#E9E4D8]" />

            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={showPin} onChange={e=>setShowPin(e.target.checked)}/>Show PINs</label>
            {/* Admin Verification PIN */}
            <form onSubmit={(event) => requestSave(event, 'pin')} onChange={() => markDirty(pinScope)} className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#2A1E1B] uppercase tracking-wider mb-1 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[#C5A059]" /> Admin Security PIN
                </h3>
                <p className="text-xs text-[#8A8174]">Your six-digit PIN is required for login and sensitive management actions. Choose six digits that are not repeated or a simple sequence.</p>
              </div>

              <div className="flex w-full max-w-[250px] flex-col gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1" htmlFor="account-field-8">Current PIN</label>
                  <input id="account-field-8"
                    type={showPin?"text":"password"} required inputMode="numeric" pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="••••••"
                    value={pinForm.currentPin}
                    onChange={(e) => setPinForm({ ...pinForm, currentPin: e.target.value.replace(/\D/g,'').slice(0,6) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs text-center font-bold tracking-[0.3em] outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1" htmlFor="account-field-9">New PIN</label>
                  <input id="account-field-9"
                    type={showPin?"text":"password"} required inputMode="numeric" pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="••••••"
                    value={pinForm.newPin}
                    onChange={(e) => setPinForm({ ...pinForm, newPin: e.target.value.replace(/\D/g,'').slice(0,6) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs text-center font-bold tracking-[0.3em] outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1" htmlFor="account-field-10">Confirm PIN</label>
                  <input id="account-field-10"
                    type={showPin?"text":"password"} required inputMode="numeric" pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="••••••"
                    value={pinForm.confirmPin}
                    onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value.replace(/\D/g,'').slice(0,6) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs text-center font-bold tracking-[0.3em] outline-none focus:border-[#C5A059]"
                  />
                  {pinMismatch && <p className="mt-1 text-[11px] text-red-600">PINs do not match.</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={busy || pinMismatch || ![pinForm.currentPin,pinForm.newPin,pinForm.confirmPin].every(pin=>/^\d{6}$/.test(pin))}
                className="bg-[#3A342B] hover:bg-[#2A241B] text-[#F5F1EA] px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 border border-[#C5A059]/30 disabled:cursor-not-allowed disabled:opacity-50"
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
              <p className="text-xs text-[#8A8174]">Your latest 50 recorded account and management actions</p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#E9E4D8]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FFFDF8] border-b border-[#E9E4D8] text-[10px] font-semibold text-[#9A907F] uppercase tracking-wider">
                    <th className="p-4">Action Event</th>
                    <th className="p-4">Module</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9E4D8] text-xs">
                  {(!activityLogs||!activityLogs.length)&&<tr><td colSpan={4} className="p-6 text-center">{activityError||(!activityLogs?'Loading activity…':'No recorded activity yet.')}</td></tr>}
                  {activityLogs?.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F6F4EF]/50 transition-colors">
                      <td className="p-4 font-bold text-[#2A1E1B] flex items-center gap-2">
                        <Smartphone className="h-3.5 w-3.5 text-[#C5A059]" />
                        {log.event}
                      </td>
                      <td className="p-4 font-mono text-xs text-[#8A8174]">{log.module}</td>
                      <td className="p-4 text-[#443523]">{log.status}</td>
                      <td className="p-4 text-[#8A8174]">{new Date(log.occurred_at).toLocaleString('en-PH',{timeZone:'Asia/Manila'})}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      <ProfilePictureModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentImageUrl={profileForm.avatarUrl}
        onUpload={handleAvatarImport}
        onRemove={handleAvatarRemove}
      />
      <SaveChangesModal
        isOpen={Boolean(pendingSave)}
        onCancel={() => setPendingSave('')}
        onConfirm={confirmSave}
      />

    </div>
  );
}