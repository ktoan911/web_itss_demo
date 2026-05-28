import type { Task } from '@/types/task';
import { Card } from '@/components/common/Card';
import { PriorityBadge } from '@/components/common/Badge';
import { formatDateTime } from '@/utils/dateUtils';

export function UpcomingTasks({ tasks, onClick }: { tasks: Task[]; onClick: (t: Task) => void }) {
  if (!tasks.length) {
    return <Card><p className="text-sm text-text-muted">Nothing upcoming.</p></Card>;
  }
  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold">Upcoming deadlines</h3>
      <ul className="divide-y divide-border">
        {tasks.map((t) => (
          <li key={t._id}>
            <button onClick={() => onClick(t)} className="flex w-full items-center justify-between py-2 text-left">
              <div>
                <div className="text-sm font-medium">{t.title}</div>
                <div className="text-xs text-text-muted">{formatDateTime(t.deadline)}</div>
              </div>
              <PriorityBadge priority={t.priority} />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
