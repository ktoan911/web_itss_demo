import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';

type Props = {
  open: boolean; taskTitle?: string;
  onKeepGoing: () => void; onMarkComplete: () => void;
};

export function EstimateReachedDialog({ open, taskTitle, onKeepGoing, onMarkComplete }: Props) {
  return (
    <Modal open={open} onClose={onKeepGoing} title="Estimate reached" size="sm">
      <p className="text-sm text-text-muted">
        You've reached the estimated pomodoros for {taskTitle ? `"${taskTitle}"` : 'this task'}. Mark as completed?
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onKeepGoing}>Keep going</Button>
        <Button onClick={onMarkComplete}>Mark complete</Button>
      </div>
    </Modal>
  );
}
