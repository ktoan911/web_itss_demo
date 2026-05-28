import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format, parseISO } from 'date-fns';
import type { TaskStatsResponse } from '@/types/statistics';
import { Card } from '@/components/common/Card';

export function TaskCompletionChart({ data }: { data: TaskStatsResponse }) {
  const fmt = data.map((d) => ({ ...d, label: format(parseISO(d.date), 'MMM d') }));
  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold">Tasks completed</h3>
      <div className="h-64">
        <ResponsiveContainer>
          <BarChart data={fmt}>
            <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey="count" fill="rgb(99 102 241)" radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
