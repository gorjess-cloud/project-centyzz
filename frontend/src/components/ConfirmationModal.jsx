import { createPortal } from "react-dom";
import useModalScrollLock from "../hooks/useModalScrollLock";

export default function ConfirmationModal({
  title = "Please confirm",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  centered = false,
  confirmClassName,
  onCancel,
  onConfirm,
}) {
  useModalScrollLock(true);
  return createPortal(
    <div className={`fixed inset-0 z-[100] flex ${centered ? "items-center justify-center p-4" : "items-end justify-center p-0 sm:items-center sm:p-4"} bg-black/45`} onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel?.(); }}>
      <section role="alertdialog" aria-modal="true" aria-labelledby="confirmation-title" aria-describedby="confirmation-message" className={`w-full rounded-2xl border border-[#E7DFD4] bg-[#FFFDF8] p-6 font-sans text-[#2A1E1B] shadow-2xl ${centered ? "max-w-md" : "rounded-t-3xl sm:max-w-md sm:rounded-2xl"}`}>
        <h2 id="confirmation-title" className="text-xl font-bold">{title}</h2>
        <p id="confirmation-message" className="mt-2 text-sm text-[#756D60]">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="min-h-11 rounded-full border border-[#D7CDBD] px-5 text-sm font-semibold text-[#6D6253] hover:bg-[#F6F0E6]">{cancelLabel}</button>
          <button type="button" onClick={onConfirm} className={`min-h-11 rounded-full px-5 text-sm text-white ${danger ? "bg-red-700 hover:bg-red-800 font-bold" : confirmClassName || "bg-[#4A3928] hover:bg-[#2A1E1B] font-bold"}`}>{confirmLabel}</button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
