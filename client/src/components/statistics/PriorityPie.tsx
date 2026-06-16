import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useTranslation } from 'react-i18next';
import type { PriorityCount } from '@/types/statistics';
import { Card } from '@/components/common/Card';

const COLOR: Record<string, string> = { Low: '#16a34a', Medium: '#f59e0b', High: '#dc2626' };
const KEY: Record<string, string> = { Low: 'priority.low', Medium: 'priority.medium', High: 'priority.high' };

export function PriorityPie({ data }: { data: PriorityCount[] }) {
  const { t } = useTranslation('statistics');
  const fmt = data.map((d) => ({ ...d, name: t(KEY[d.priority]) }));
  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold">{t('charts.tasksByPriority')}</h3>
      <div className="h-56">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={fmt} dataKey="count" nameKey="name" outerRadius={80} label>
              {fmt.map((d) => <Cell key={d.priority} fill={COLOR[d.priority]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
