import type { Task } from '@/types/task';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common/Card';
import { PriorityBadge } from '@/components/common/Badge';
import { formatDateTime } from '@/utils/dateUtils';

export function UpcomingTasks({ tasks, onClick }: { tasks: Task[]; onClick: (t: Task) => void }) {
  const { t } = useTranslation('dashboard');
  if (!tasks.length) {
    return <Card><p className="text-sm text-text-muted">{t('upcoming.empty')}</p></Card>;
  }
  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold">{t('upcoming.title')}</h3>
      <ul className="divide-y divide-border">
        {tasks.map((task) => (
          <li key={task._id}>
            <button onClick={() => onClick(task)} className="flex w-full items-center justify-between py-2 text-left">
              <div>
                <div className="text-sm font-medium">{task.title}</div>
                <div className="text-xs text-text-muted">{formatDateTime(task.deadline)}</div>
              </div>
              <PriorityBadge priority={task.priority} />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
