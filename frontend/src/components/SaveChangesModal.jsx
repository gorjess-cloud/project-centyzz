import ConfirmationModal from "./ConfirmationModal";

export default function SaveChangesModal({ isOpen, onCancel, onConfirm, centered = false, isDarkMode = false }) {
  if (!isOpen) return null;

  return (
    <ConfirmationModal
      title="Save Changes"
      message="Are you sure you want to save these changes?"
      confirmLabel="Confirm"
      confirmClassName={isDarkMode ? "bg-[#D9B269] hover:bg-[#C89C54] text-[#1E1713] font-semibold" : "bg-green-600 hover:bg-green-700 font-semibold"}
      centered={centered}
      isDarkMode={isDarkMode}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
