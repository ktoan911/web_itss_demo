import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string; error?: string; hint?: string;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, hint, className, id, ...rest }, ref,
) {
  const inputId = id ?? `i-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <div className="space-y-1">
      {label && <label htmlFor={inputId} className="text-sm font-medium">{label}</label>}
      <input
        id={inputId}
        ref={ref}
        className={cn(
          'block w-full rounded-2xl border bg-surface px-3 py-2 text-sm outline-none placeholder:text-text-muted',
          error ? 'border-priority-high focus:border-priority-high' : 'border-border focus:border-primary-500',
          className,
        )}
        aria-invalid={!!error}
        {...rest}
      />
      {error ? (
        <p className="text-xs text-priority-high">{error}</p>
      ) : hint ? (
        <p className="text-xs text-text-muted">{hint}</p>
      ) : null}
    </div>
  );
});
