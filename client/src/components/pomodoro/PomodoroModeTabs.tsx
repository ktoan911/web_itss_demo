import { useTranslation } from 'react-i18next';
import type { PomodoroMode } from '@/types/pomodoro';
import { cn } from '@/utils/cn';

type Props = {
  mode: PomodoroMode;
  onChange: (m: PomodoroMode) => void;
  disabled?: boolean;
};

const tabs: { key: PomodoroMode; labelKey: string }[] = [
  { key: 'Focus', labelKey: 'modes.focus' },
  { key: 'ShortBreak', labelKey: 'modes.shortBreak' },
  { key: 'LongBreak', labelKey: 'modes.longBreak' },
];

export function PomodoroModeTabs({ mode, onChange, disabled }: Props) {
  const { t } = useTranslation('pomodoro');
  return (
    <div className="inline-flex rounded-2xl border border-border bg-surface p-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          disabled={disabled}
          onClick={() => onChange(tab.key)}
          className={cn(
            'rounded-xl px-3 py-1.5 text-sm transition',
            mode === tab.key ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10' : 'text-text-muted hover:bg-bg',
          )}
        >
          {t(tab.labelKey)}
        </button>
      ))}
    </div>
  );
}
