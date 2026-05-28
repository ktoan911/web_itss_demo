import type { PomodoroSession } from '@/types/pomodoro';
import { fromNow } from '@/utils/dateUtils';

export function PomodoroHistoryList({ sessions }: { sessions: PomodoroSession[] }) {
  if (sessions.length === 0) {
    return <p className="text-sm text-text-muted">No sessions yet.</p>;
  }
  return (
    <ul className="space-y-2">
      {sessions.map((s) => (
        <li key={s._id} className="flex items-center justify-between rounded-2xl border border-border bg-surface px-3 py-2 text-sm">
          <span>
            <span className="font-medium">{s.mode}</span> · {s.durationMinutes} min
          </span>
          <span className="text-xs text-text-muted">{fromNow(s.startedAt)}</span>
        </li>
      ))}
    </ul>
  );
}
