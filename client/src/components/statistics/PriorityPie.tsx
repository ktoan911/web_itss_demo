import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { PriorityCount } from '@/types/statistics';
import { Card } from '@/components/common/Card';

const COLOR: Record<string, string> = { Low: '#16a34a', Medium: '#f59e0b', High: '#dc2626' };

export function PriorityPie({ data }: { data: PriorityCount[] }) {
  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold">Tasks by priority</h3>
      <div className="h-56">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="priority" outerRadius={80} label>
              {data.map((d) => <Cell key={d.priority} fill={COLOR[d.priority]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
