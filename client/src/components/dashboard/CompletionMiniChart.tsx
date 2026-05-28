import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/common/Card';
import { format, parseISO } from 'date-fns';

type Point = { date: string; count: number };

export function CompletionMiniChart({ data }: { data: Point[] }) {
  const formatted = data.map((d) => ({ ...d, label: format(parseISO(d.date), 'EEE') }));
  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold">Last 7 days completion</h3>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formatted}>
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
            <YAxis hide allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="rgb(99 102 241)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
