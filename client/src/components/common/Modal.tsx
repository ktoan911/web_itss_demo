import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

type Size = 'sm' | 'md' | 'lg' | 'xl';
type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: Size;
  children: ReactNode;
  panelClassName?: string;
  titleClassName?: string;
  closeClassName?: string;
};

const sizes: Record<Size, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
};

export function Modal({
  open,
  onClose,
  title,
  size = 'md',
  children,
  panelClassName,
  titleClassName,
  closeClassName,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={cn('w-full rounded-3xl bg-surface p-6 shadow-md', sizes[size], panelClassName)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className={cn('text-lg font-semibold', titleClassName)}>{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className={cn('rounded-2xl p-1 hover:bg-bg', closeClassName)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
