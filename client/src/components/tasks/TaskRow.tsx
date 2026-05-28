import { Check, Edit2, Trash2 } from 'lucide-react';
import type { Task } from '@/types/task';
import { OverdueBadge, PriorityBadge, StatusBadge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { formatDateTime } from '@/utils/dateUtils';

type Props = {
  task: Task; onEdit: (t: Task) => void; onDelete: (t: Task) => void; onComplete: (t: Task) => void;
};

export function TaskRow({ task, onEdit, onDelete, onComplete }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="truncate text-sm font-medium">{task.title}</h4>
          <PriorityBadge priority={task.priority} />
          <StatusBadge status={task.status} />
          {task.isOverdue && <OverdueBadge />}
        </div>
        <div className="mt-1 text-xs text-text-muted">
          {formatDateTime(task.deadline)} · ⏱ {task.completedPomodoros}/{task.estimatedPomodoros}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {task.status !== 'Completed' && (
          <Button size="sm" variant="ghost" icon={<Check className="h-4 w-4" />} onClick={() => onComplete(task)} aria-label="Complete" />
        )}
        <Button size="sm" variant="ghost" icon={<Edit2 className="h-4 w-4" />} onClick={() => onEdit(task)} aria-label="Edit" />
        <Button size="sm" variant="ghost" icon={<Trash2 className="h-4 w-4" />} onClick={() => onDelete(task)} aria-label="Delete" />
      </div>
    </div>
  );
}
