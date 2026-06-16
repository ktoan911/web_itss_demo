import type { Task } from '@/types/task';
import { useTranslation } from 'react-i18next';
import { TaskRow } from '@/components/tasks/TaskRow';
import { EmptyState } from '@/components/common/EmptyState';
import { useDeleteTask, useMarkComplete } from '@/hooks/queries/useTaskQueries';
import { toast } from 'sonner';

export function TodayTasks({ tasks, onEdit }: { tasks: Task[]; onEdit: (t: Task) => void }) {
  const { t } = useTranslation('dashboard');
  const remove = useDeleteTask();
  const complete = useMarkComplete();
  if (!tasks.length) return <EmptyState title={t('today.empty')} />;
  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskRow
          key={task._id} task={task}
          onEdit={onEdit}
          onComplete={(task) => complete.mutate(task._id, { onError: () => toast.error(t('today.completeFailed')) })}
          onDelete={(task) => remove.mutate(task._id)}
        />
      ))}
    </div>
  );
}
