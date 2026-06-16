import { useTranslation } from 'react-i18next';
import { Button } from './Button';

type Props = { title?: string; description?: string; onRetry?: () => void };

export function ErrorState({ title, description, onRetry }: Props) {
  const { t } = useTranslation('common');
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <h3 className="text-sm font-semibold text-priority-high">{title ?? t('state.somethingWrong')}</h3>
      {description && <p className="max-w-sm text-sm text-text-muted">{description}</p>}
      {onRetry && <Button variant="secondary" onClick={onRetry}>{t('actions.retry')}</Button>}
    </div>
  );
}
