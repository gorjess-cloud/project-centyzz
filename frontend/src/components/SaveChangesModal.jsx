import ConfirmationModal from "./ConfirmationModal";

export default function SaveChangesModal({ isOpen, onCancel, onConfirm, centered = false }) {
  if (!isOpen) return null;

  return (
    <ConfirmationModal
      title="Save Changes"
      message="Are you sure you want to save these changes?"
      confirmLabel="Confirm"
      confirmClassName="bg-green-600 hover:bg-green-700 font-semibold"
      centered={centered}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
