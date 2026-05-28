import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format, parseISO } from 'date-fns';
import type { DailyPomodoroPoint } from '@/types/statistics';
import { Card } from '@/components/common/Card';

export function PomodoroChart({ data }: { data: DailyPomodoroPoint[] }) {
  const fmt = data.map((d) => ({ ...d, label: format(parseISO(d.date), 'MMM d') }));
  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold">Pomodoros completed</h3>
      <div className="h-64">
        <ResponsiveContainer>
          <BarChart data={fmt}>
            <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey="sessions" fill="rgb(22 163 74)" radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
