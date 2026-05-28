import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

type Option = { value: string; label: string };
type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string; error?: string; options: Option[];
};

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { label, error, options, className, id, ...rest }, ref,
) {
  const sid = id ?? `s-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <div className="space-y-1">
      {label && <label htmlFor={sid} className="text-sm font-medium">{label}</label>}
      <select
        id={sid}
        ref={ref}
        className={cn(
          'block w-full rounded-2xl border bg-surface px-3 py-2 text-sm outline-none',
          error ? 'border-priority-high' : 'border-border focus:border-primary-500',
          className,
        )}
        {...rest}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="text-xs text-priority-high">{error}</p>}
    </div>
  );
});
