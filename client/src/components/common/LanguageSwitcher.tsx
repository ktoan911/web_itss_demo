import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS, type SupportedLanguage } from '@/i18n';
import { cn } from '@/utils/cn';

export function LanguageSwitcher({ variant = 'icon' }: { variant?: 'icon' | 'inline' }) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = (SUPPORTED_LANGUAGES as readonly string[]).includes(i18n.language)
    ? (i18n.language as SupportedLanguage)
    : 'vi';

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const change = (lng: SupportedLanguage) => {
    i18n.changeLanguage(lng);
    setOpen(false);
  };

  if (variant === 'inline') {
    return (
      <div className="flex gap-2">
        {SUPPORTED_LANGUAGES.map((lng) => (
          <button
            key={lng}
            type="button"
            onClick={() => change(lng)}
            className={cn(
              'rounded-2xl border px-3 py-1.5 text-sm transition',
              current === lng
                ? 'border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-500/10'
                : 'border-border text-text hover:bg-bg',
            )}
          >
            {LANGUAGE_LABELS[lng]}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t('language.select')}
        className="rounded-2xl p-2 text-text-muted hover:bg-bg"
      >
        <Languages className="h-5 w-5" />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">
          {SUPPORTED_LANGUAGES.map((lng) => (
            <button
              key={lng}
              onClick={() => change(lng)}
              className={cn(
                'flex w-full items-center px-4 py-2.5 text-sm transition hover:bg-bg',
                current === lng ? 'font-semibold text-primary-600' : 'text-text',
              )}
            >
              {LANGUAGE_LABELS[lng]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
