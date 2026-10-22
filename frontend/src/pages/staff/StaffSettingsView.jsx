import { useState, useRef } from 'react';
import { Pencil, Check, Camera, Eye, EyeOff, Crop, Upload, ZoomIn, ZoomOut, ShieldCheck } from 'lucide-react';
import { Toast, useToast, Modal, ConfirmModal, card, input } from '../../components/staff/ui';

const lbl = 'mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#443523]';
const primary = 'flex items-center justify-center gap-2 rounded-lg bg-[#4A3928] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#2A1E1B] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40';
const secondary = 'rounded-lg border border-[#E7DFD4] bg-white px-5 py-2.5 text-xs font-bold text-[#443523] transition hover:bg-[#F6F0E6] active:scale-95';

function Field({ label, value, onChange, disabled, pencil, type = 'text', placeholder, options, className = '' }) {
  const [show, setShow] = useState(false);
  const isPw = type === 'password';
  return (
    <label className={className}>
      <span className={`${lbl} text-[#5D5549]`}>{label}</span>
      <span className="relative block">
        {options ? (
          <select className={`${input} min-h-11 rounded-lg border-[#E2DDCF] bg-[#FBFAF6] px-3 py-3 ${disabled ? 'text-[#716B61]' : ''}`} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
            {options.map((o) => <option key={o}>{o}</option>)}
          </select>
        ) : (
          <input type={isPw && show ? 'text' : type} className={`${input} min-h-11 rounded-lg border-[#E2DDCF] bg-[#FBFAF6] px-3 py-3 ${isPw || pencil ? 'pr-9' : ''} ${disabled ? 'text-[#716B61]' : 'focus:bg-white'}`} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder={placeholder} />
        )}
        {isPw ? (
          <button type="button" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)} className="absolute right-3 top-3.5 text-[#8A8174] hover:text-[#2A1E1B]">{show ? <EyeOff size={14} /> : <Eye size={14} />}</button>
        ) : pencil && <Pencil size={13} className="pointer-events-none absolute right-3 top-3.5 text-[#8A8174]" />}
      </span>
    </label>
  );
}

export default function StaffSettingsView({ currentUser }) {
  const [tab, setTab] = useState('personal');
  const [editing, setEditing] = useState(false);
  const [credentialsEditing, setCredentialsEditing] = useState(false);
  const [toast, say] = useToast();
  const [photo, setPhoto] = useState(currentUser?.avatarUrl || '');
  const fileRef = useRef(null);
  const [photoModal, setPhotoModal] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [cropSource, setCropSource] = useState('');
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef(null);
  const [p, setP] = useState({ first: currentUser?.firstName || 'Jessica', last: currentUser?.lastName || 'Palma', mi: '', sex: 'Female', birthday: '', contact: '' });
  const [c, setC] = useState({ email: currentUser?.email || 'jessestaff@example.com', otp: '', old: '', next: '', repeat: '' });
  const sp = (k) => (v) => setP({ ...p, [k]: v });
  const sc = (k) => (v) => setC({ ...c, [k]: v });
  const mismatch = c.next && c.repeat && c.next !== c.repeat;
  const cancel = () => setC({ ...c, otp: '', old: '', next: '', repeat: '' });
  const initials = (p.first[0] || '') + (p.last[0] || '');
  const pickPhoto = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      if (!f.type.startsWith('image/')) { say('Choose an image file'); return; }
      const reader = new FileReader();
      reader.onload = () => { setCropSource(reader.result); setZoom(1); setOffset({ x: 0, y: 0 }); setPhotoModal('crop'); };
      reader.readAsDataURL(f);
    }
    e.target.value = '';
  };
  const saveCrop = () => {
    const image = new Image();
    image.onload = () => {
      const size = 320;
      const scale = Math.max(size / image.width, size / image.height) * zoom;
      const width = image.width * scale;
      const height = image.height * scale;
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      canvas.getContext('2d').drawImage(image, (size - width) / 2 + offset.x, (size - height) / 2 + offset.y, width, height);
      setPhoto(canvas.toDataURL('image/jpeg', 0.9));
      setCropSource(''); setPhotoModal('view'); say('Photo updated');
    };
    image.src = cropSource;
  };

  return (
    <div className="fade-in mx-auto max-w-7xl pb-8">
      <div className="mb-7 border-b border-[#E5DECF] pb-5"><p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#A1885B]">MY ACCOUNT</p><h1 className="text-2xl font-bold text-[#2A1E1B]">Profile settings</h1><p className="mt-1 text-sm text-[#756D60]">Manage your personal information and sign-in details.</p></div>

      <div className={`${card} mb-5 flex min-h-36 flex-wrap items-center gap-6 rounded-2xl bg-white px-6 py-5 shadow-[0_4px_18px_rgba(65,49,29,0.04)] sm:px-10`}>
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-[#D7DCE5] bg-[#4A3928] text-2xl font-bold text-[#C5A059]">
            {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : initials}
          </div>
          <button type="button" aria-label="Manage profile picture" onClick={() => setPhotoModal('view')} className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#FFFDF8] bg-[#B9B07A] text-white shadow transition hover:scale-110 active:scale-95"><Camera size={13} /></button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold text-[#2A1E1B]">{p.first} {p.last}</h2>
          <p className="mt-1 text-xs text-[#756D60]">{c.email}</p>
          <span className="mt-2 inline-flex rounded-full bg-[#F3EDDF] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#8B7045]">Staff account</span>
        </div>
      </div>

      {photoModal === 'view' && <Modal title="Profile Picture" onClose={() => setPhotoModal(false)} size="max-w-lg">
        <p className="-mt-2 mb-5 text-xs text-[#6F765D]">Preview, update, re-crop, or remove your profile picture.</p>
        <div className="mx-auto mb-6 flex h-64 w-64 max-w-full items-center justify-center overflow-hidden rounded-full bg-[#F6F0E6] text-5xl font-bold text-[#C5A059]">{photo ? <img src={photo} alt="Profile preview" className="h-full w-full object-cover" /> : initials}</div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" disabled={!photo} onClick={() => setConfirm({ message: 'Remove the current photo?', action: () => { setPhoto(''); setPhotoModal(false); say('Profile picture removed'); } })} className="text-xs font-bold text-red-600 disabled:opacity-40">Remove</button>
          <div className="flex gap-2"><button type="button" disabled={!photo} onClick={() => { setCropSource(photo); setZoom(1); setOffset({ x: 0, y: 0 }); setPhotoModal('crop'); }} className={secondary}><Crop size={14} className="mr-1 inline" />Crop</button><button type="button" onClick={() => fileRef.current?.click()} className={primary}><Upload size={14} />Upload New Photo</button></div>
        </div>
      </Modal>}
      {photoModal === 'crop' && <Modal title="Crop Profile Picture" onClose={() => { setPhotoModal(false); setCropSource(''); }} size="max-w-lg">
        <p className="-mt-2 mb-5 text-xs text-[#6F765D]">Drag to reposition and use the slider to zoom your photo.</p>
        <div className="mx-auto mb-5 h-72 w-72 max-w-full touch-none overflow-hidden rounded-xl bg-[#F6F0E6]" onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, offset }; }} onPointerMove={(e) => { if (drag.current) setOffset({ x: drag.current.offset.x + e.clientX - drag.current.x, y: drag.current.offset.y + e.clientY - drag.current.y }); }} onPointerUp={() => { drag.current = null; }}>
          {cropSource && <img src={cropSource} alt="Crop preview" draggable="false" className="pointer-events-none h-full w-full object-cover" style={{ transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)` }} />}
          <div className="pointer-events-none absolute" />
        </div>
        <div className="mb-6 flex items-center gap-3"><ZoomOut size={17} className="shrink-0 text-[#443523]" /><input aria-label="Zoom photo" type="range" min="1" max="3" step="0.01" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-[#4A3928]" /><ZoomIn size={17} className="shrink-0 text-[#443523]" /></div>
        <div className="flex justify-end gap-2"><button type="button" onClick={() => { setPhotoModal(photo ? 'view' : false); setCropSource(''); }} className={secondary}>Cancel</button><button type="button" onClick={saveCrop} className={primary}>Done</button></div>
      </Modal>}

      <div role="tablist" aria-label="Account settings sections" className="mx-auto mb-5 flex w-full max-w-xl rounded-xl border border-[#E4DED2] bg-[#F2EFE8] p-1">
        {[['personal', 'Personal Information'], ['login', 'Login Credentials']].map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`flex-1 rounded-lg px-3 py-2.5 text-xs font-semibold transition ${tab === id ? 'bg-white text-[#4A3928] shadow-sm ring-1 ring-[#E8E0D2]' : 'text-[#756D60] hover:text-[#2A1E1B]'}`}>{label}</button>
        ))}
      </div>

      {tab === 'personal' ? (
        <section className={`${card} fade-in min-h-[380px] rounded-2xl bg-white p-5 shadow-[0_4px_18px_rgba(65,49,29,0.04)] sm:px-10 sm:py-7`}>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-xl font-bold text-[#2A1E1B]">Personal information</h2><p className="mt-1 text-xs text-[#8A8174]">Your details help the team recognize and contact you.</p></div>
            <div className="flex gap-2">
              {editing && <button onClick={() => setConfirm({ message: 'Discard your profile changes?', action: () => setEditing(false) })} className={secondary}>Cancel Changes</button>}
              <button onClick={() => { if (editing) setConfirm({ message: 'Save your profile changes?', action: () => { say('Profile updated'); setEditing(false); } }); else setEditing(true); }} className={editing ? primary : secondary}>{editing ? <><Check size={14} /> Save Changes</> : 'Edit Profile'}</button>
            </div>
          </div>
          {editing && <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#E7DAB8] bg-[#FBF7E9] px-4 py-3 text-xs text-[#746342]"><Pencil size={15} className="mt-0.5 shrink-0" /><span><strong className="block">Editing your profile</strong>Update the fields below, then save your changes when you’re done.</span></div>}
          <div className="mx-auto grid max-w-4xl gap-x-5 gap-y-5 rounded-xl bg-[#FBFAF6] px-4 py-5 sm:grid-cols-6 sm:px-8 sm:py-7">
            <Field label="First name" value={p.first} onChange={sp('first')} disabled={!editing} pencil={editing} className="sm:col-span-2" />
            <Field label="Last name" value={p.last} onChange={sp('last')} disabled={!editing} pencil={editing} className="sm:col-span-2" />
            <Field label="Middle initial" value={p.mi} onChange={sp('mi')} disabled={!editing} pencil={editing} className="sm:col-span-2" />
            <Field label="Sex" value={p.sex} onChange={sp('sex')} disabled={!editing} options={['Female', 'Male', 'Prefer not to say']} className="sm:col-span-3" />
            <Field label="Birthday" type={editing ? 'date' : 'text'} value={p.birthday} onChange={sp('birthday')} disabled={!editing} className="sm:col-span-3" />
            <Field label="Contact number" value={p.contact} onChange={sp('contact')} disabled={!editing} pencil={editing} className="sm:col-span-6" />
          </div>
        </section>
      ) : (
        <section className={`${card} fade-in min-h-[380px] rounded-2xl bg-white p-5 shadow-[0_4px_18px_rgba(65,49,29,0.04)] sm:px-10 sm:py-8`}>
          <div className="mb-6 text-center"><h2 className="text-xl font-bold text-[#2A1E1B]">Login credentials</h2><p className="mt-1 text-xs text-[#8A8174]">Your email and password keep your staff account secure.</p></div>
          <div className="mx-auto max-w-4xl rounded-xl bg-[#FBFAF6] p-4 sm:px-8 sm:py-6">
            <div className="mb-5 flex justify-end">
              {credentialsEditing ? <div className="flex gap-2"><button onClick={() => setConfirm({ message: 'Discard your credential changes?', action: () => { cancel(); setCredentialsEditing(false); } })} className={secondary}>Cancel Changes</button><button onClick={() => setConfirm({ message: 'Save your credential changes?', action: () => { say('Credentials updated'); setCredentialsEditing(false); cancel(); } })} className={primary}><Check size={14} /> Save Changes</button></div> : <button onClick={() => setCredentialsEditing(true)} className={secondary}>Update Credentials</button>}
            </div>
            {credentialsEditing ? <>
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#E7DAB8] bg-[#FBF7E9] px-4 py-3 text-xs text-[#746342]"><ShieldCheck size={15} className="mt-0.5 shrink-0" /><span><strong className="block">Credential update in progress</strong>Use the one-time code to verify your email update. Password changes require your current password.</span></div>
              <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <Field label="Email address" value={c.email} onChange={sc('email')} pencil />
                <button onClick={() => say('OTP sent to your email')} className={`${primary} py-3`}>Send OTP</button>
                <Field label="OTP verification code" value={c.otp} onChange={sc('otp')} placeholder="Enter the code sent to your email" className="sm:col-span-2" />
              </div>
              <div className="mt-6 rounded-[1.5rem] bg-[#EEEEEE] p-5 sm:px-8 sm:py-6">
                <h3 className="text-sm font-bold text-[#2A1E1B]">Change password</h3>
                <p className="mb-5 mt-1 text-xs text-[#687284]">Enter your current password, then choose and confirm a new password.</p>
                <Field label="Old password" type="password" value={c.old} onChange={sc('old')} placeholder="Enter your current password" />
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="New password" type="password" value={c.next} onChange={sc('next')} placeholder="Enter a new password" />
                  <Field label="Repeat new password" type="password" value={c.repeat} onChange={sc('repeat')} placeholder="Confirm your new password" />
                </div>
                {mismatch && <p role="alert" className="mt-3 text-xs font-bold text-rose-600">Passwords do not match.</p>}
                <div className="mt-5 flex justify-end"><button disabled={!!mismatch || !c.old || !c.next || !c.repeat} onClick={() => setConfirm({ message: 'Submit this password change request?', action: () => { say('Password change requested'); cancel(); } })} className={primary}><Check size={14} /> Request Password Change</button></div>
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
    </div>
  );
}
