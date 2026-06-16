import { Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common/Card';

export function StreakCard({ streak }: { streak: number }) {
  const { t } = useTranslation('dashboard');
  return (
    <Card className="flex items-center gap-4" data-tour="streak">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-500/15">
        <Flame className="h-6 w-6" />
      </div>
      <div>
        <div className="text-2xl font-semibold tabular-nums">{streak}</div>
        <div className="text-sm text-text-muted">
          {t('streak.suffix', { count: streak })}
        </div>
      </div>
    </Card>
  );
}
