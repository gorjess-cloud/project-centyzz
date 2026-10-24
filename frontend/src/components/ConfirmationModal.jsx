export default function ConfirmationModal({
  title = "Please confirm",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onCancel,
  onConfirm,
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel?.(); }}>
      <section role="alertdialog" aria-modal="true" aria-labelledby="confirmation-title" aria-describedby="confirmation-message" className="w-full rounded-t-3xl border border-[#E7DFD4] bg-[#FFFDF8] p-6 text-[#2A1E1B] shadow-2xl sm:max-w-md sm:rounded-2xl">
        <h2 id="confirmation-title" className="font-serif text-xl font-bold">{title}</h2>
        <p id="confirmation-message" className="mt-2 text-sm text-[#756D60]">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="min-h-11 rounded-full border border-[#D7CDBD] px-5 text-sm font-semibold text-[#6D6253] hover:bg-[#F6F0E6]">{cancelLabel}</button>
          <button type="button" onClick={onConfirm} className={`min-h-11 rounded-full px-5 text-sm font-bold text-white ${danger ? "bg-red-700 hover:bg-red-800" : "bg-[#4A3928] hover:bg-[#2A1E1B]"}`}>{confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}
