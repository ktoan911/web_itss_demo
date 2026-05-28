import { Modal } from './Modal';
import { Button } from './Button';

type Props = {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; description?: string; confirmText?: string; danger?: boolean;
};

export function ConfirmDialog({
  open, onClose, onConfirm, title, description, confirmText = 'Confirm', danger,
}: Props) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      {description && <p className="text-sm text-text-muted">{description}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose(); }}>{confirmText}</Button>
      </div>
    </Modal>
  );
}
