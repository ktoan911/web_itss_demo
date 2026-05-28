import { useState } from 'react';
import type { View } from 'react-big-calendar';
import { Card } from '@/components/common/Card';
import { Loading } from '@/components/common/Loading';
import { ErrorState } from '@/components/common/ErrorState';
import { CalendarView } from '@/components/calendar/CalendarView';
import { DayTasksPanel } from '@/components/calendar/DayTasksPanel';
import { TaskFormModal } from '@/components/tasks/TaskFormModal';
import { useTasksQuery } from '@/hooks/queries/useTaskQueries';
import type { Task } from '@/types/task';

export default function CalendarPage() {
  const tasks = useTasksQuery({ sortBy: 'deadline' });
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [view, setView] = useState<View>('month');
  const [editing, setEditing] = useState<Task | null>(null);

  if (tasks.isLoading) return <Loading />;
  if (tasks.isError) return <ErrorState onRetry={() => tasks.refetch()} />;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
      <Card padded={false}>
        <div className="p-2">
          <CalendarView
            tasks={tasks.data ?? []}
            selectedDate={selectedDate}
            view={view}
            onViewChange={setView}
            onSelectDay={setSelectedDate}
            onSelectTask={setEditing}
          />
        </div>
      </Card>
      <DayTasksPanel date={selectedDate} tasks={tasks.data ?? []} onEdit={setEditing} />
      <TaskFormModal open={!!editing} onClose={() => setEditing(null)} task={editing} />
    </div>
  );
}
