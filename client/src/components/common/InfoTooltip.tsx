import { useState } from 'react';
import { Info } from 'lucide-react';

export function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={text}
        className="text-text-muted transition hover:text-text"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 top-5 z-50 w-56 -translate-x-1/2 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-normal text-text shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  );
}
