import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string };

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(function Textarea(
  { label, error, className, id, ...rest }, ref,
) {
  const tid = id ?? `t-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <div className="space-y-1">
      {label && <label htmlFor={tid} className="text-sm font-medium">{label}</label>}
      <textarea
        id={tid}
        ref={ref}
        rows={4}
        className={cn(
          'block w-full rounded-2xl border bg-surface px-3 py-2 text-sm outline-none',
          error ? 'border-priority-high' : 'border-border focus:border-primary-500',
          className,
        )}
        {...rest}
      />
      {error && <p className="text-xs text-priority-high">{error}</p>}
    </div>
  );
});
