import type { StatRange } from '@/types/statistics';
import { cn } from '@/utils/cn';

const opts: { v: StatRange; label: string }[] = [
  { v: '7days', label: '7 days' },
  { v: '30days', label: '30 days' },
  { v: 'month', label: 'This month' },
];

export function RangeSelector({ value, onChange }: { value: StatRange; onChange: (v: StatRange) => void }) {
  return (
    <div className="inline-flex rounded-2xl border border-border bg-surface p-1">
      {opts.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={cn(
            'rounded-xl px-3 py-1.5 text-sm transition',
            value === o.v ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10' : 'text-text-muted hover:bg-bg',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
