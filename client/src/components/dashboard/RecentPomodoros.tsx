import type { PomodoroSession } from '@/types/pomodoro';
import { Card } from '@/components/common/Card';
import { fromNow } from '@/utils/dateUtils';

export function RecentPomodoros({ sessions }: { sessions: PomodoroSession[] }) {
  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold">Recent pomodoros</h3>
      {sessions.length === 0 ? (
        <p className="text-sm text-text-muted">No sessions yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {sessions.map((s) => (
            <li key={s._id} className="flex items-center justify-between py-2 text-sm">
              <span><span className="font-medium">{s.mode}</span> · {s.durationMinutes} min</span>
              <span className="text-xs text-text-muted">{fromNow(s.startedAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
