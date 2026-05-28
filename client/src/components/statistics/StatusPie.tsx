import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { StatusCount } from '@/types/statistics';
import { Card } from '@/components/common/Card';

const COLOR: Record<string, string> = { Todo: '#64748b', InProgress: '#2563eb', Completed: '#16a34a' };

export function StatusPie({ data }: { data: StatusCount[] }) {
  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold">Tasks by status</h3>
      <div className="h-56">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="status" outerRadius={80} label>
              {data.map((d) => <Cell key={d.status} fill={COLOR[d.status]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
