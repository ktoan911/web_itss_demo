import { Check, Clock, Edit2, Trash2 } from 'lucide-react';
import type { Task } from '@/types/task';
import { Card } from '@/components/common/Card';
import { OverdueBadge, PriorityBadge, StatusBadge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { formatDateTime } from '@/utils/dateUtils';

type Props = {
  task: Task;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onComplete: (t: Task) => void;
  onClick?: (t: Task) => void;
};

export function TaskCard({ task, onEdit, onDelete, onComplete, onClick }: Props) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <button onClick={() => onClick?.(task)} className="flex-1 text-left">
          <h3 className="line-clamp-1 text-sm font-semibold">{task.title}</h3>
          {task.description && <p className="mt-1 line-clamp-2 text-xs text-text-muted">{task.description}</p>}
        </button>
        <PriorityBadge priority={task.priority} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-text-muted">
        <Clock className="h-3.5 w-3.5" />
        <span>{formatDateTime(task.deadline)}</span>
        <span>·</span>
        <span>⏱ {task.completedPomodoros}/{task.estimatedPomodoros}</span>
        <StatusBadge status={task.status} />
        {task.isOverdue && <OverdueBadge />}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {task.status !== 'Completed' && (
          <Button size="sm" variant="secondary" icon={<Check className="h-4 w-4" />} onClick={() => onComplete(task)}>
            Complete
          </Button>
        )}
        <Button size="sm" variant="ghost" icon={<Edit2 className="h-4 w-4" />} onClick={() => onEdit(task)}>Edit</Button>
        <Button size="sm" variant="ghost" icon={<Trash2 className="h-4 w-4" />} onClick={() => onDelete(task)}>Delete</Button>
      </div>
    </Card>
  );
}
