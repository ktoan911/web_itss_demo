import type { Notification } from '@/types/notification';
import { fromNow } from '@/utils/dateUtils';
import { cn } from '@/utils/cn';

const labelByType: Record<Notification['type'], string> = {
  task_overdue: 'Overdue',
  task_completed: 'Completed',
  pomodoro_done: 'Pomodoro',
  deadline_soon: 'Deadline',
  estimated_reached: 'Estimate',
};

type Props = { n: Notification; onClick: (n: Notification) => void };

export function NotificationItem({ n, onClick }: Props) {
  return (
    <button
      onClick={() => onClick(n)}
      className={cn(
        'flex w-full items-start gap-2 rounded-2xl px-3 py-2 text-left transition hover:bg-bg',
        !n.isRead && 'bg-primary-50/40 dark:bg-primary-500/10',
      )}
    >
      {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-600" />}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="truncate text-sm font-medium">{n.title}</span>
          <span className="ml-2 text-[10px] uppercase text-text-muted">{labelByType[n.type]}</span>
        </div>
        <p className="line-clamp-2 text-xs text-text-muted">{n.message}</p>
        <p className="mt-1 text-[11px] text-text-muted">{fromNow(n.createdAt)}</p>
      </div>
    </button>
  );
}
