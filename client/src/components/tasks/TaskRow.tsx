import { Check, Edit2, Trash2 } from 'lucide-react';
import type { Task } from '@/types/task';
import { OverdueBadge, PriorityBadge, StatusBadge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { formatDateTime } from '@/utils/dateUtils';
import { cn } from '@/utils/cn';

type Props = {
  task: Task;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onComplete: (t: Task) => void;
  onTagClick?: (tag: string) => void;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
};

export function TaskRow({
  task,
  onEdit,
  onDelete,
  onComplete,
  onTagClick,
  selected,
  onToggleSelect,
}: Props) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3',
        selected && 'ring-2 ring-primary-500',
      )}
    >
      {onToggleSelect && (
        <input
          type="checkbox"
          checked={!!selected}
          onChange={() => onToggleSelect(task._id)}
          aria-label={`Select task ${task.title}`}
          className="h-4 w-4 cursor-pointer rounded border-border text-primary-600 focus:ring-primary-500"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h4 className="truncate text-sm font-medium">{task.title}</h4>
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onTagClick?.(tag)}
                  className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-700 transition hover:bg-primary-100 dark:bg-primary-500/10 dark:hover:bg-primary-500/20"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
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
          <Button
            size="sm"
            variant="ghost"
            icon={<Check className="h-4 w-4" />}
            onClick={() => onComplete(task)}
            aria-label="Complete"
          />
        )}
        <Button
          size="sm"
          variant="ghost"
          icon={<Edit2 className="h-4 w-4" />}
          onClick={() => onEdit(task)}
          aria-label="Edit"
        />
        <Button
          size="sm"
          variant="ghost"
          icon={<Trash2 className="h-4 w-4" />}
          onClick={() => onDelete(task)}
          aria-label="Delete"
        />
      </div>
    </div>
  );
}
