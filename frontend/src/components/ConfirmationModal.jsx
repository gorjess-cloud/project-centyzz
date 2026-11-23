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
  isDarkMode = false,
  onCancel,
  onConfirm,
}) {
  useModalScrollLock(true);
  const shell = isDarkMode
    ? "border-[#51493B] bg-[#211F1B] text-[#F5F1EA]"
    : "border-[#E7DFD4] bg-[#FFFDF8] text-[#2A1E1B]";
  const mutedText = isDarkMode ? "text-[#C7BDAE]" : "text-[#756D60]";
  const secondaryButton = isDarkMode
    ? "border-[#51493B] bg-[#171512] text-[#F5F1EA] hover:bg-white/5"
    : "border-[#D7CDBD] bg-transparent text-[#6D6253] hover:bg-[#F6F0E6]";
  const primaryButton = danger
    ? "bg-red-700 hover:bg-red-800 font-bold"
    : confirmClassName || (isDarkMode ? "bg-[#EAD6A2] text-[#1E1713] hover:bg-[#D8BE7C] font-bold" : "bg-[#4A3928] hover:bg-[#2A1E1B] font-bold");

  return createPortal(
    <div className={`fixed inset-0 z-[100] flex ${centered ? "items-center justify-center p-4" : "items-end justify-center p-0 sm:items-center sm:p-4"} bg-black/45`} onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel?.(); }}>
      <section role="alertdialog" aria-modal="true" aria-labelledby="confirmation-title" aria-describedby="confirmation-message" className={`w-full rounded-2xl border p-6 font-sans shadow-2xl ${shell} ${centered ? "max-w-md" : "rounded-t-3xl sm:max-w-md sm:rounded-2xl"}`}>
        <h2 id="confirmation-title" className="text-xl font-bold">{title}</h2>
        <p id="confirmation-message" className={`mt-2 text-sm ${mutedText}`}>{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className={`min-h-11 rounded-full border px-5 text-sm font-semibold ${secondaryButton}`}>{cancelLabel}</button>
          <button type="button" onClick={onConfirm} className={`min-h-11 rounded-full px-5 text-sm ${primaryButton}`}>{confirmLabel}</button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
