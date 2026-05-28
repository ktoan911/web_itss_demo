import { type LucideIcon } from 'lucide-react';
import { Card } from '@/components/common/Card';

type Props = { icon: LucideIcon; label: string; value: string | number; tone?: 'default' | 'warn' | 'good' };

const toneClasses: Record<NonNullable<Props['tone']>, string> = {
  default: 'text-primary-600',
  warn: 'text-priority-high',
  good: 'text-priority-low',
};

export function SummaryCard({ icon: Icon, label, value, tone = 'default' }: Props) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-text-muted">{label}</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
        </div>
        <Icon className={`h-6 w-6 ${toneClasses[tone]}`} />
      </div>
    </Card>
  );
}
