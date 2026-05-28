import { format, isSameDay, parseISO } from 'date-fns';
import type { Task } from '@/types/task';
import { Card } from '@/components/common/Card';
import { TaskRow } from '@/components/tasks/TaskRow';
import { EmptyState } from '@/components/common/EmptyState';
import { useDeleteTask, useMarkComplete } from '@/hooks/queries/useTaskQueries';
import { toast } from 'sonner';

type Props = { date: Date | null; tasks: Task[]; onEdit: (t: Task) => void };

export function DayTasksPanel({ date, tasks, onEdit }: Props) {
  const remove = useDeleteTask();
  const complete = useMarkComplete();
  if (!date) {
    return <Card><p className="text-sm text-text-muted">Select a day to view tasks.</p></Card>;
  }
  const items = tasks.filter((t) => isSameDay(parseISO(t.deadline), date));
  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold">Tasks on {format(date, 'MMM d, yyyy')}</h3>
      {items.length === 0 ? (
        <EmptyState title="No tasks on this day" />
      ) : (
        <div className="space-y-2">
          {items.map((t) => (
            <TaskRow
              key={t._id} task={t}
              onEdit={onEdit}
              onComplete={(t) => complete.mutate(t._id, { onError: () => toast.error('Failed') })}
              onDelete={(t) => remove.mutate(t._id)}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
