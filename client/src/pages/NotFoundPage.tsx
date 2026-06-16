import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFoundPage() {
  const { t } = useTranslation('common');
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-3">
      <h1 className="text-2xl font-semibold">{t('notFound.title')}</h1>
      <p className="text-text-muted">{t('notFound.message')}</p>
      <Link to="/dashboard" className="text-primary-600 hover:underline">{t('notFound.backHome')}</Link>
    </div>
  );
}
