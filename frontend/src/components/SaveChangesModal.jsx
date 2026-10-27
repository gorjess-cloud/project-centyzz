import ConfirmationModal from './ConfirmationModal';

export default function SaveChangesModal({ isOpen, onCancel, onConfirm, centered = true,
  title = 'Save changes?', message = 'Would you like to save the changes you have made?' }) {
  if (!isOpen) return null;
  return <ConfirmationModal centered={centered} title={title} message={message}
    cancelLabel="Keep editing" confirmLabel="Save changes" onCancel={onCancel} onConfirm={onConfirm} />;
}
