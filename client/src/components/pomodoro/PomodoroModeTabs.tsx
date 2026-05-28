import type { PomodoroMode } from '@/types/pomodoro';
import { cn } from '@/utils/cn';

type Props = {
  mode: PomodoroMode;
  onChange: (m: PomodoroMode) => void;
  disabled?: boolean;
};

const tabs: { key: PomodoroMode; label: string }[] = [
  { key: 'Focus', label: 'Focus' },
  { key: 'ShortBreak', label: 'Short Break' },
  { key: 'LongBreak', label: 'Long Break' },
];

export function PomodoroModeTabs({ mode, onChange, disabled }: Props) {
  return (
    <div className="inline-flex rounded-2xl border border-border bg-surface p-1">
      {tabs.map((t) => (
        <button
          key={t.key}
          disabled={disabled}
          onClick={() => onChange(t.key)}
          className={cn(
            'rounded-xl px-3 py-1.5 text-sm transition',
            mode === t.key ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10' : 'text-text-muted hover:bg-bg',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
