import { useState } from 'react';
import { Pencil, Check, Camera, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Toast, useToast, ConfirmModal, card, input } from '../../components/staff/ui';
import { api } from '../../api/client.js';
import { useUnsavedChanges } from '../../components/UnsavedChangesProvider';
import ProfilePictureModal from '../../components/ProfilePictureModal';
import SaveChangesModal from '../../components/SaveChangesModal';

const lbl = 'mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#8A8174]';
const primary = 'flex items-center justify-center gap-2 rounded-xl border border-[#C5A059]/30 bg-[#3A342B] px-5 py-2.5 text-xs font-bold text-[#F5F1EA] shadow-md transition-all hover:bg-[#2A241B] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50';
const secondary = 'rounded-xl border border-[#E9E4D8] bg-white px-5 py-2.5 text-xs font-bold text-[#443523] transition hover:bg-[#F6F4EF] active:scale-95';

function Field({ label, value, onChange, disabled, pencil, type = 'text', placeholder, options, className = '' }) {
  const [show, setShow] = useState(false);
  const isPw = type === 'password';
  return (
    <label className={className}>
      <span className={lbl}>{label}</span>
      <span className="relative block">
        {options ? (
          <select className={`${input} rounded-xl border-[#E9E4D8] bg-[#FFFDF8] px-3.5 py-2.5 text-xs font-medium focus:ring-2 focus:ring-[#C5A059]/20 ${disabled ? 'bg-[#F6F4EF] text-[#8A8174]' : ''}`} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
            {options.map((o) => <option key={o}>{o}</option>)}
          </select>
        ) : (
          <input type={isPw && show ? 'text' : type} className={`${input} rounded-xl border-[#E9E4D8] bg-[#FFFDF8] px-3.5 py-2.5 text-xs font-medium focus:ring-2 focus:ring-[#C5A059]/20 ${isPw || pencil ? 'pr-9' : ''} ${disabled ? 'bg-[#F6F4EF] text-[#8A8174]' : 'text-[#2A1E1B]'}`} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder={placeholder} />
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
  const [editing, setEditing] = useState(false);
  const [credentialsEditing, setCredentialsEditing] = useState(false);
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
      setEditing(false);
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
    <div className="fade-in mx-auto w-full max-w-7xl space-y-6 pb-8 text-[#443523]">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-[#2A1E1B]">Account Settings</h1>
          <p className="text-xs text-[#8A8174]">Manage your personal information and sign-in details.</p>
        </div>
      </header>

      <div className={`${card} flex flex-col items-center justify-between gap-6 rounded-2xl border-[#E9E4D8] bg-white p-6 shadow-sm sm:flex-row`}>
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
        <div role="tablist" aria-label="Account settings sections" className="flex w-full items-center justify-center rounded-xl border border-[#E9E4D8] bg-[#F6F4EF] p-1.5 sm:w-auto">
          {[['personal', 'Personal Information'], ['login', 'Login Credentials']].map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`flex-1 rounded-lg px-4 py-2 text-xs font-bold transition-all sm:flex-none ${tab === id ? 'bg-[#3A342B] text-[#F5F1EA] shadow-xs' : 'text-[#8A8174] hover:text-[#2A1E1B]'}`}>{label}</button>
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
        <section className={`${card} fade-in min-h-[380px] rounded-2xl border-[#E9E4D8] bg-white p-6 shadow-sm sm:p-8`}>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="mb-1 text-sm font-bold uppercase tracking-wider text-[#2A1E1B]">Personal Details</h2><p className="text-xs text-[#8A8174]">Your details help the team recognize and contact you.</p></div>
            <div className="flex gap-2">
              {editing && <button onClick={() => setConfirm({ message: 'Discard your profile changes?', action: () => { setP({ first: currentUser?.firstName || 'Jessica', last: currentUser?.lastName || 'Palma', mi: '', sex: 'Female', birthday: '', contact: currentUser?.phoneNumber || '' }); setEditing(false); markSaved(profileScope); } })} className={secondary}>Cancel Changes</button>}
              <button onClick={() => { if (editing) setPendingSave(() => saveProfile); else setEditing(true); }} className={editing ? primary : secondary}>{editing ? <><Check size={14} /> Save Changes</> : 'Edit Profile'}</button>
            </div>
          </div>
          {editing && <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#E7DAB8] bg-[#FBF7E9] px-4 py-3 text-xs text-[#746342]"><Pencil size={15} className="mt-0.5 shrink-0" /><span><strong className="block">Editing your profile</strong>Update the fields below, then save your changes when you’re done.</span></div>}
          <div className="mx-auto grid max-w-4xl gap-x-5 gap-y-5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] px-4 py-5 sm:grid-cols-6 sm:px-8 sm:py-7">
            <Field label="First name" value={p.first} onChange={sp('first')} disabled={!editing} pencil={editing} className="sm:col-span-2" />
            <Field label="Last name" value={p.last} onChange={sp('last')} disabled={!editing} pencil={editing} className="sm:col-span-2" />
            <Field label="Middle initial" value={p.mi} onChange={sp('mi')} disabled={!editing} pencil={editing} className="sm:col-span-2" />
            <Field label="Sex" value={p.sex} onChange={sp('sex')} disabled={!editing} options={['Female', 'Male', 'Prefer not to say']} className="sm:col-span-3" />
            <Field label="Birthday" type={editing ? 'date' : 'text'} value={p.birthday} onChange={sp('birthday')} disabled={!editing} className="sm:col-span-3" />
            <Field label="Contact number" value={p.contact} onChange={sp('contact')} disabled={!editing} pencil={editing} className="sm:col-span-6" />
          </div>
        </section>
      ) : (
        <section className={`${card} fade-in min-h-[380px] rounded-2xl border-[#E9E4D8] bg-white p-6 shadow-sm sm:p-8`}>
          <div className="mb-6"><h2 className="mb-1 text-sm font-bold uppercase tracking-wider text-[#2A1E1B]">Login Credentials</h2><p className="text-xs text-[#8A8174]">Your email and password keep your staff account secure.</p></div>
          <div className="mx-auto max-w-4xl rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] p-4 sm:p-6">
            <div className="mb-5 flex justify-end">
              {credentialsEditing ? <div className="flex gap-2"><button onClick={() => setConfirm({ message: 'Discard your credential changes?', action: () => { cancel(); setCredentialsEditing(false); markSaved(credentialScope); } })} className={secondary}>Cancel Changes</button><button onClick={() => setPendingSave(() => () => { say('Credentials updated'); setCredentialsEditing(false); cancel(); markSaved(credentialScope); })} className={primary}><Check size={14} /> Save Changes</button></div> : <button onClick={() => setCredentialsEditing(true)} className={secondary}>Update Credentials</button>}
            </div>
            {credentialsEditing ? <>
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#E7DAB8] bg-[#FBF7E9] px-4 py-3 text-xs text-[#746342]"><ShieldCheck size={15} className="mt-0.5 shrink-0" /><span><strong className="block">Credential update in progress</strong>Use the one-time code to verify your email update. Password changes require your current password.</span></div>
              <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <Field label="Email address" value={c.email} onChange={sc('email')} pencil />
                <button onClick={() => say('Email change verification is not available yet. No OTP was sent.')} className={`${primary} py-3`}>Send OTP</button>
                <Field label="OTP verification code" value={c.otp} onChange={sc('otp')} placeholder="Enter the code sent to your email" className="sm:col-span-2" />
              </div>
              <div className="mt-6 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] p-5 sm:p-6">
                <h3 className="text-sm font-bold text-[#2A1E1B]">Change Password</h3>
                <p className="mb-5 mt-1 text-xs text-[#8A8174]">Enter your current password, then choose and confirm a new password.</p>
                <Field label="Old password" type="password" value={c.old} onChange={sc('old')} placeholder="Enter your current password" />
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="New password" type="password" value={c.next} onChange={sc('next')} placeholder="Enter a new password" />
                  <Field label="Repeat new password" type="password" value={c.repeat} onChange={sc('repeat')} placeholder="Confirm your new password" />
                </div>
                {mismatch && <p role="alert" className="mt-3 text-xs font-bold text-rose-600">Passwords do not match.</p>}
                <div className="mt-5 flex justify-end"><button disabled={!!mismatch || !c.old || !c.next || !c.repeat} onClick={() => setPendingSave(() => changePassword)} className={primary}><Check size={14} /> Request Password Change</button></div>
              </div>
            </> : <div className="space-y-5">
              <Field label="Email address" value={c.email} disabled onChange={() => {}} />
              <Field label="Password" value="••••••••••••••••" disabled onChange={() => {}} />
              <p className="text-xs text-[#687284]">Select <strong>Update Credentials</strong> to change your email or password.</p>
            </div>}
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
