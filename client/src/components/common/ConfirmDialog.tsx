import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';
import { Button } from './Button';

type Props = {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; description?: string; confirmText?: string; danger?: boolean;
};

export function ConfirmDialog({
  open, onClose, onConfirm, title, description, confirmText, danger,
}: Props) {
  const { t } = useTranslation('common');
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      {description && <p className="text-sm text-text-muted">{description}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>{t('actions.cancel')}</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose(); }}>{confirmText ?? t('actions.confirm')}</Button>
      </div>
    </Modal>
  );
}
