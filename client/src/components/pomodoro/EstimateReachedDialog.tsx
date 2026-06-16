import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';

type Props = {
  open: boolean; taskTitle?: string;
  onKeepGoing: () => void; onMarkComplete: () => void;
};

export function EstimateReachedDialog({ open, taskTitle, onKeepGoing, onMarkComplete }: Props) {
  const { t } = useTranslation('pomodoro');
  return (
    <Modal open={open} onClose={onKeepGoing} title={t('dialog.estimateReached.title')} size="sm">
      <p className="text-sm text-text-muted">
        {t('dialog.estimateReached.body', {
          task: taskTitle ? `"${taskTitle}"` : t('dialog.estimateReached.thisTask'),
        })}
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onKeepGoing}>{t('dialog.estimateReached.keepGoing')}</Button>
        <Button onClick={onMarkComplete}>{t('dialog.estimateReached.markComplete')}</Button>
      </div>
    </Modal>
  );
}
