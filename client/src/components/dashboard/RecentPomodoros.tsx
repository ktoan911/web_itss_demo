import type { PomodoroSession } from '@/types/pomodoro';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common/Card';
import { fromNow } from '@/utils/dateUtils';

export function RecentPomodoros({ sessions }: { sessions: PomodoroSession[] }) {
  const { t } = useTranslation('dashboard');
  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold">{t('recentPomodoros.title')}</h3>
      {sessions.length === 0 ? (
        <p className="text-sm text-text-muted">{t('recentPomodoros.empty')}</p>
      ) : (
        <ul className="divide-y divide-border">
          {sessions.map((s) => (
            <li key={s._id} className="flex items-center justify-between py-2 text-sm">
              <span><span className="font-medium">{s.mode}</span> · {s.durationMinutes} {t('recentPomodoros.min')}</span>
              <span className="text-xs text-text-muted">{fromNow(s.startedAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
