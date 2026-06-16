import { useTranslation } from 'react-i18next';
import type { StatRange } from '@/types/statistics';
import { cn } from '@/utils/cn';

const opts: StatRange[] = ['7days', '30days', 'month'];

export function RangeSelector({ value, onChange }: { value: StatRange; onChange: (v: StatRange) => void }) {
  const { t } = useTranslation('statistics');
  return (
    <div className="inline-flex rounded-2xl border border-border bg-surface p-1">
      {opts.map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={cn(
            'rounded-xl px-3 py-1.5 text-sm transition',
            value === v ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10' : 'text-text-muted hover:bg-bg',
          )}
        >
          {t(`range.${v}`)}
        </button>
      ))}
    </div>
  );
}
