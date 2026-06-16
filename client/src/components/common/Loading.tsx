import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Loading({ label }: { label?: string }) {
  const { t } = useTranslation('common');
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-text-muted">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm">{label ?? t('state.loading')}</span>
    </div>
  );
}

export function CardSkeleton() {
  return <div className="h-32 animate-pulse rounded-3xl bg-surface border border-border" />;
}
