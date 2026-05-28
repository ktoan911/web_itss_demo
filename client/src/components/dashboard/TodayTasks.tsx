import type { Task } from '@/types/task';
import { TaskRow } from '@/components/tasks/TaskRow';
import { EmptyState } from '@/components/common/EmptyState';
import { useDeleteTask, useMarkComplete } from '@/hooks/queries/useTaskQueries';
import { toast } from 'sonner';

export function TodayTasks({ tasks, onEdit }: { tasks: Task[]; onEdit: (t: Task) => void }) {
  const remove = useDeleteTask();
  const complete = useMarkComplete();
  if (!tasks.length) return <EmptyState title="No tasks for today" />;
  return (
    <div className="space-y-2">
      {tasks.map((t) => (
        <TaskRow
          key={t._id} task={t}
          onEdit={onEdit}
          onComplete={(t) => complete.mutate(t._id, { onError: () => toast.error('Failed') })}
          onDelete={(t) => remove.mutate(t._id)}
        />
      ))}
    </div>
  );
}
