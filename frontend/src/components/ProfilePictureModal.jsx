import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Camera, ImagePlus, Trash2, X } from 'lucide-react';
import useModalScrollLock from '../hooks/useModalScrollLock';

export default function ProfilePictureModal({ isOpen, onClose, currentImageUrl = '', onUpload, onRemove, isDarkMode = false }) {
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const dialog = useRef(null);
  const fileInput = useRef(null);
  const reader = useRef(null);
  const titleId = useId();
  useModalScrollLock(isOpen);
  useEffect(() => {
    if (!isOpen) return undefined;
    setPreview(currentImageUrl); setError(''); setBusy(false);
    const previous = document.activeElement;
    dialog.current?.focus();
    return () => { reader.current?.abort(); previous?.focus?.(); };
  }, [isOpen, currentImageUrl]);
  if (!isOpen) return null;
  function chooseFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) { setError('Choose a JPG, PNG or WebP image.'); return; }
    if (file.size > 2 * 1024 * 1024) { setError('Choose an image smaller than 2 MB.'); return; }
    reader.current?.abort();
    const next = new FileReader(); reader.current = next;
    next.onload = () => { if (reader.current === next) setPreview(String(next.result)); };
    next.onerror = () => setError('This image could not be read. Please choose another one.');
    next.readAsDataURL(file);
  }
  async function save() {
    if (busy || !preview || preview === currentImageUrl) return;
    setBusy(true); setError('');
    try { await onUpload?.(preview); onClose?.(); }
    catch { setError('The photo could not be saved. Please try again.'); }
    finally { setBusy(false); }
  }
  function keyDown(event) {
    if (event.key === 'Escape' && !busy) { event.preventDefault(); onClose?.(); }
    if (event.key === 'Tab') {
      const controls = [...dialog.current.querySelectorAll('button:not(:disabled), input:not(:disabled)')].filter(el => el.type !== 'file');
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  }
  return createPortal(<div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
    onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose?.(); }}>
    <section ref={dialog} tabIndex={-1} onKeyDown={keyDown} role="dialog" aria-modal="true" aria-labelledby={titleId}
      className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl outline-none ${isDarkMode ? 'border-[#51493B] bg-[#211F1B] text-[#F5F1EA]' : 'border-[#E7DFD4] bg-[#FFFDF8] text-[#2A1E1B]'}`}>
      <header className="flex items-center justify-between gap-3"><h2 id={titleId} className="text-lg font-bold">Profile picture</h2>
        <button type="button" aria-label="Close profile picture editor" disabled={busy} onClick={onClose} className="rounded-lg p-2 hover:bg-black/5"><X size={20}/></button></header>
      <div className="mx-auto my-6 flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-4 border-[#C5A059]/30 bg-[#EEE6D7] text-[#8B5E3C]">
        {preview ? <img src={preview} alt="Profile picture preview" className="h-full w-full object-cover"/> : <Camera size={44} aria-hidden="true"/>}
      </div>
      <p className="text-center text-xs text-[#8A8174]">JPG, PNG or WebP · up to 2 MB</p>
      <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseFile} className="hidden" aria-label="Choose profile image"/>
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="mt-5 flex justify-center gap-3">
        <button type="button" disabled={busy} onClick={() => fileInput.current?.click()} className="flex items-center gap-2 rounded-lg border border-[#D7CDBD] px-3 py-2 text-xs font-semibold"><ImagePlus size={16}/>Choose image</button>
        {currentImageUrl && <button type="button" disabled={busy} onClick={() => { onRemove?.(); onClose?.(); }} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-600"><Trash2 size={16}/>Remove</button>}
      </div>
      <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} disabled={busy} className="rounded-full border border-[#D7CDBD] px-4 py-2 text-sm">Cancel</button>
        <button type="button" disabled={busy || !preview || preview === currentImageUrl} onClick={save} className="rounded-full bg-[#4A3928] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{busy ? 'Saving…' : 'Use this photo'}</button></div>
    </section>
  </div>, document.body);
}
