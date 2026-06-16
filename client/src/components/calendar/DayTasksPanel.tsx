import { format, isSameDay, parseISO } from 'date-fns';
import type { Task } from '@/types/task';
import { Card } from '@/components/common/Card';
import { TaskRow } from '@/components/tasks/TaskRow';
import { EmptyState } from '@/components/common/EmptyState';
import { useDeleteTask, useMarkComplete } from '@/hooks/queries/useTaskQueries';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

type Props = { date: Date | null; tasks: Task[]; onEdit: (t: Task) => void };

export function DayTasksPanel({ date, tasks, onEdit }: Props) {
  const { t } = useTranslation('calendar');
  const remove = useDeleteTask();
  const complete = useMarkComplete();
  if (!date) {
    return <Card><p className="text-sm text-text-muted">{t('panel.selectDay')}</p></Card>;
  }
  const items = tasks.filter((task) => isSameDay(parseISO(task.deadline), date));
  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold">{t('panel.tasksOnDate', { date: format(date, 'MMM d, yyyy') })}</h3>
      {items.length === 0 ? (
        <EmptyState title={t('panel.empty')} />
      ) : (
        <div className="space-y-2">
          {items.map((task) => (
            <TaskRow
              key={task._id} task={task}
              onEdit={onEdit}
              onComplete={(task) => complete.mutate(task._id, { onError: () => toast.error(t('toast.completeFailed')) })}
              onDelete={(task) => remove.mutate(task._id)}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
