import { type HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

type Props = HTMLAttributes<HTMLDivElement> & { padded?: boolean };

export function Card({ className, padded = true, ...rest }: Props) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-border bg-surface shadow-sm',
        padded && 'p-5', className,
      )}
      {...rest}
    />
  );
}
