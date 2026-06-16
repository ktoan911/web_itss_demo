import { useTranslation } from 'react-i18next';
import type { PomodoroSession } from '@/types/pomodoro';
import { fromNow } from '@/utils/dateUtils';

const MODE_KEY: Record<string, string> = {
  Focus: 'focus',
  ShortBreak: 'shortBreak',
  LongBreak: 'longBreak',
};

export function PomodoroHistoryList({ sessions }: { sessions: PomodoroSession[] }) {
  const { t } = useTranslation('pomodoro');
  if (sessions.length === 0) {
    return <p className="text-sm text-text-muted">{t('history.empty')}</p>;
  }
  return (
    <ul className="space-y-2">
      {sessions.map((s) => (
        <li key={s._id} className="flex items-center justify-between rounded-2xl border border-border bg-surface px-3 py-2 text-sm">
          <span>
            <span className="font-medium">{t(`modes.${MODE_KEY[s.mode] ?? 'focus'}`)}</span> ·{' '}
            {t('history.minutes', { count: s.durationMinutes })}
          </span>
          <span className="text-xs text-text-muted">{fromNow(s.startedAt)}</span>
        </li>
      ))}
    </ul>
  );
}
