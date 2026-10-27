import { useState } from 'react';
import { Pencil, Check, Camera, Eye, EyeOff, ShieldCheck, Save } from 'lucide-react';
import { Toast, useToast, ConfirmModal } from '../../components/staff/ui';
import { api } from '../../api/client.js';
import { useUnsavedChanges } from '../../components/UnsavedChangesProvider';
import ProfilePictureModal from '../../components/ProfilePictureModal';
import SaveChangesModal from '../../components/SaveChangesModal';

const lbl = 'mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#8A8174]';
const primary = 'flex items-center justify-center gap-2 rounded-xl border border-[#C5A059]/30 bg-[#3A342B] px-5 py-2.5 text-xs font-bold text-[#F5F1EA] shadow-md transition-all hover:bg-[#2A241B] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50';

function Field({ label, value, onChange, disabled, pencil, type = 'text', placeholder, options, className = '' }) {
  const [show, setShow] = useState(false);
  const isPw = type === 'password';
  return (
    <label className={className}>
      <span className={lbl}>{label}</span>
      <span className="relative block">
        {options ? (
          <select className={`w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs font-medium text-[#2A1E1B] outline-none focus:border-[#C5A059] ${disabled ? 'bg-[#F6F4EF] text-[#8A8174]' : ''}`} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
            {options.map((o) => <option key={o}>{o}</option>)}
          </select>
        ) : (
          <input type={isPw && show ? 'text' : type} className={`w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs font-medium text-[#2A1E1B] outline-none focus:border-[#C5A059] ${isPw || pencil ? 'pr-9' : ''} ${disabled ? 'bg-[#F6F4EF] text-[#8A8174]' : ''}`} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder={placeholder} />
        )}
        {isPw ? (
          <button type="button" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)} className="absolute right-3 top-3 text-[#8A8174] hover:text-[#2A1E1B]">{show ? <EyeOff size={14} /> : <Eye size={14} />}</button>
        ) : pencil && <Pencil size={13} className="pointer-events-none absolute right-3 top-3 text-[#8A8174]" />}
      </span>
    </label>
  );
}

export default function StaffSettingsView({ currentUser, onUserUpdated }) {
  const { markDirty, markSaved } = useUnsavedChanges();
  const profileScope = `staff-profile-${currentUser?.id || currentUser?.email || 'current'}`;
  const credentialScope = `staff-credentials-${currentUser?.id || currentUser?.email || 'current'}`;
  const photoScope = `staff-photo-${currentUser?.id || currentUser?.email || 'current'}`;
  const [tab, setTab] = useState('personal');
  const [toast, say] = useToast();
  const [photo, setPhoto] = useState(currentUser?.avatarUrl || '');
  const [confirm, setConfirm] = useState(null);
  const [pendingSave, setPendingSave] = useState(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [p, setP] = useState({ first: currentUser?.firstName || 'Jessica', last: currentUser?.lastName || 'Palma', mi: '', sex: 'Female', birthday: '', contact: currentUser?.phoneNumber || '' });
  const [c, setC] = useState({ email: currentUser?.email || 'jessestaff@example.com', otp: '', old: '', next: '', repeat: '' });
  const sp = (k) => (v) => { setP({ ...p, [k]: v }); markDirty(profileScope); };
  const sc = (k) => (v) => { setC({ ...c, [k]: v }); markDirty(credentialScope); };
  const mismatch = c.next && c.repeat && c.next !== c.repeat;
  const cancel = () => setC((previous) => ({ ...previous, otp: '', old: '', next: '', repeat: '' }));
  const saveProfile = async () => {
    try {
      const result = await api.updateMyProfile(currentUser?.accessToken, {
        firstName: p.first, lastName: p.last, phoneNumber: p.contact,
      });
      onUserUpdated?.(result.data);
      markSaved(profileScope);
      say('Profile updated');
    } catch (error) { say(error.message || 'Profile update failed'); }
  };
  const changePassword = async () => {
    if (c.next !== c.repeat) return say('Passwords do not match');
    try {
      await api.changeManagementCredentials(currentUser?.accessToken, {
        currentPassword: c.old, newPassword: c.next,
      });
      say('Password updated');
      cancel();
      markSaved(credentialScope);
    } catch (error) { say(error.message || 'Password change failed'); }
  };
  const initials = (p.first[0] || '') + (p.last[0] || '');
  const savePhoto = (imageUrl) => {
    setPhoto(imageUrl);
    markDirty(photoScope);
    say('Photo updated');
  };
  const removePhoto = () => {
    setPhoto('');
    markDirty(photoScope);
    say('Profile picture removed');
  };

  return (
    <div className="w-full space-y-6 pb-6 text-[#443523]">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-[#2A1E1B]">Account Settings</h1>
          <p className="text-xs text-[#8A8174]">Manage your personal information and sign-in details.</p>
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-[#E9E4D8] shadow-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <button type="button" aria-label="Manage profile picture" onClick={() => setIsPhotoModalOpen(true)} className="group relative cursor-pointer">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-[#C5A059]/30 bg-[#4A3928] text-2xl font-bold text-[#C5A059] shadow-md">
            {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : initials}
          </div>
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"><Camera size={20} /></span>
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-[#2A1E1B]">{p.first} {p.last}</h2>
          <p className="mt-0.5 text-xs text-[#8A8174]">{c.email}</p>
          <span className="mt-2 inline-flex rounded-full border border-[#D8B066] bg-[#E8C27B] px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#5A3810]">Staff Account</span>
        </div>
        <div role="tablist" aria-label="Account settings sections" className="flex items-center bg-[#F6F4EF] p-1.5 rounded-xl border border-[#E9E4D8] self-stretch sm:self-auto justify-center">
          {[['personal', 'Profile Info'], ['login', 'Security & PIN']].map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === id ? 'bg-[#3A342B] text-[#F5F1EA] shadow-xs' : 'text-[#8A8174] hover:text-[#2A1E1B]'}`}>{label}</button>
          ))}
        </div>
      </div>

      <ProfilePictureModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        currentImageUrl={photo}
        onUpload={savePhoto}
        onRemove={removePhoto}
      />

      {tab === 'personal' ? (
        <section className="h-auto bg-white rounded-2xl border border-[#E9E4D8] shadow-sm p-6 sm:p-8 space-y-6">
          <div className="mb-6">
            <h2 className="mb-1 text-sm font-bold uppercase tracking-wider text-[#2A1E1B]">Personal Details</h2>
            <p className="text-xs text-[#8A8174]">Your details help the team recognize and contact you.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="First name" value={p.first} onChange={sp('first')} />
            <Field label="Last name" value={p.last} onChange={sp('last')} />
            <Field
              label="Email address"
              type="email"
              value={c.email}
              onChange={(value) => {
                setC((previous) => ({ ...previous, email: value }));
                markDirty(profileScope);
              }}
            />
            <Field label="Contact number" value={p.contact} onChange={sp('contact')} />
            <div>
              <span className={lbl}>Assigned System Role</span>
              <input
                type="text"
                disabled
                value={currentUser?.role || 'STAFF'}
                className="w-full cursor-not-allowed rounded-xl border border-[#E9E4D8] bg-[#F6F4EF] px-3.5 py-2.5 text-xs font-bold text-[#8A8174]"
              />
              <p className="mt-1 text-[10px] text-[#8A8174]">Role assignments can only be modified by Superadmin accounts.</p>
            </div>
          </div>
          <div className="pt-2">
              <button type="button" onClick={() => setPendingSave(() => saveProfile)} className="flex items-center gap-2 rounded-xl border border-[#C5A059]/30 bg-[#3A342B] px-6 py-2.5 text-xs font-bold text-[#F5F1EA] shadow-md transition-all hover:bg-[#2A241B] active:scale-95">
                <Check size={16} className="text-[#C5A059]" />
              <span>Save Profile Changes</span>
            </button>
          </div>
        </section>
      ) : (
        <section className="h-auto bg-white rounded-2xl border border-[#E9E4D8] shadow-sm p-6 sm:p-8 space-y-6">
          <div className="mb-6"><h2 className="mb-1 text-sm font-bold uppercase tracking-wider text-[#2A1E1B]">Login Credentials</h2><p className="text-xs text-[#8A8174]">Your email and password keep your staff account secure.</p></div>
          <div className="max-w-3xl">
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#E7DAB8] bg-[#FBF7E9] px-4 py-3 text-xs text-[#746342]">
              <ShieldCheck size={15} className="mt-0.5 shrink-0" />
              <span><strong className="block">Credential settings</strong>Use the one-time code to verify your email update. Password changes require your current password.</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <Field label="Email address" value={c.email} onChange={sc('email')} pencil />
              <button type="button" onClick={() => say('Email change verification is not available yet. No OTP was sent.')} className={`${primary} py-3`}>Send OTP</button>
              <Field label="OTP verification code" value={c.otp} onChange={sc('otp')} placeholder="Enter the code sent to your email" className="sm:col-span-2" />
            </div>
            <div className="mt-6 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] p-5 sm:p-6">
              <h3 className="text-sm font-bold text-[#2A1E1B]">Change Password</h3>
              <p className="mb-5 mt-1 text-xs text-[#8A8174]">Enter your current password, then choose and confirm a new password.</p>
              <Field label="Current password" type="password" value={c.old} onChange={sc('old')} placeholder="Enter your current password" />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="New password" type="password" value={c.next} onChange={sc('next')} placeholder="Enter a new password" />
                <Field label="Repeat new password" type="password" value={c.repeat} onChange={sc('repeat')} placeholder="Confirm your new password" />
              </div>
              {mismatch && <p role="alert" className="mt-3 text-xs font-bold text-rose-600">Passwords do not match.</p>}
            </div>
            <div className="pt-2">
              <button
                type="button"
                disabled={!!mismatch || !c.old || !c.next || !c.repeat}
                onClick={() => setPendingSave(() => changePassword)}
                className="flex items-center gap-2 rounded-xl border border-[#C5A059]/30 bg-[#3A342B] px-6 py-2.5 text-xs font-bold text-[#F5F1EA] shadow-md transition-all hover:bg-[#2A241B] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={16} className="text-[#C5A059]" />
                <span>Save Credentials</span>
              </button>
            </div>
          </div>
        </section>
      )}
      <Toast msg={toast} />
      {confirm && <ConfirmModal message={confirm.message} danger={confirm.message.includes('Remove')} onCancel={() => setConfirm(null)} onConfirm={() => { confirm.action(); setConfirm(null); }} />}
      <SaveChangesModal
        isOpen={Boolean(pendingSave)}
        centered
        onCancel={() => setPendingSave(null)}
        onConfirm={() => {
          const action = pendingSave;
          setPendingSave(null);
          action?.();
        }}
      />
    </div>
  );
}
