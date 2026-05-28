import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format, parseISO } from 'date-fns';
import type { DailyPomodoroPoint } from '@/types/statistics';
import { Card } from '@/components/common/Card';

export function FocusMinutesChart({ data }: { data: DailyPomodoroPoint[] }) {
  const fmt = data.map((d) => ({ ...d, label: format(parseISO(d.date), 'MMM d') }));
  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold">Focus minutes</h3>
      <div className="h-64">
        <ResponsiveContainer>
          <LineChart data={fmt}>
            <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip />
            <Line type="monotone" dataKey="focusMinutes" stroke="rgb(99 102 241)" strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
