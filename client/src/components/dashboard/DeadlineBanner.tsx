import { AlertTriangle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Task } from '@/types/task';

type Props = {
  overdueCount: number;
  dueSoonTasks: Task[];
  dueSoonHours: number;
  onSelect: (t: Task) => void;
};

export function DeadlineBanner({ overdueCount, dueSoonTasks, dueSoonHours, onSelect }: Props) {
  const { t } = useTranslation('dashboard');
  if (overdueCount === 0 && dueSoonTasks.length === 0) return null;

  return (
    <div
      data-tour="deadline-banner"
      className="rounded-3xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-500/10"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-200">
        <AlertTriangle className="h-4 w-4" />
        {t('deadlineBanner.title')}
      </div>
      <div className="mt-2 space-y-2 text-sm text-amber-900 dark:text-amber-100">
        {overdueCount > 0 && (
          <p>
            {t('deadlineBanner.overduePrefix')} <strong>{overdueCount}</strong>{' '}
            {t('deadlineBanner.overdueSuffix', { count: overdueCount })}
          </p>
        )}
        {dueSoonTasks.length > 0 && (
          <div>
            <p className="mb-1 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {t('deadlineBanner.dueSoon', { hours: dueSoonHours })}
            </p>
            <ul className="space-y-1">
              {dueSoonTasks.map((task) => (
                <li key={task._id}>
                  <button
                    onClick={() => onSelect(task)}
                    className="underline-offset-2 hover:underline"
                  >
                    {task.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
