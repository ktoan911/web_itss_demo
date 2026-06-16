import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useTranslation } from 'react-i18next';
import type { StatusCount } from '@/types/statistics';
import { Card } from '@/components/common/Card';

const COLOR: Record<string, string> = { Todo: '#64748b', InProgress: '#2563eb', Completed: '#16a34a' };
const KEY: Record<string, string> = { Todo: 'status.todo', InProgress: 'status.in_progress', Completed: 'status.done' };

export function StatusPie({ data }: { data: StatusCount[] }) {
  const { t } = useTranslation('statistics');
  const fmt = data.map((d) => ({ ...d, name: t(KEY[d.status]) }));
  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold">{t('charts.tasksByStatus')}</h3>
      <div className="h-56">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={fmt} dataKey="count" nameKey="name" outerRadius={80} label>
              {fmt.map((d) => <Cell key={d.status} fill={COLOR[d.status]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
