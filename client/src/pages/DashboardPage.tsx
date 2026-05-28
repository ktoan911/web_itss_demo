import { useState } from 'react';
import { CheckCircle, Clock, AlertTriangle, ListTodo, Timer, Flame } from 'lucide-react';
import { Loading } from '@/components/common/Loading';
import { ErrorState } from '@/components/common/ErrorState';
import { Card } from '@/components/common/Card';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { TodayTasks } from '@/components/dashboard/TodayTasks';
import { UpcomingTasks } from '@/components/dashboard/UpcomingTasks';
import { RecentPomodoros } from '@/components/dashboard/RecentPomodoros';
import { CompletionMiniChart } from '@/components/dashboard/CompletionMiniChart';
import { TaskFormModal } from '@/components/tasks/TaskFormModal';
import { useDashboardQuery } from '@/hooks/queries/useDashboardQuery';
import { useAuth } from '@/hooks/useAuth';
import { minutesToHM } from '@/utils/dateUtils';
import type { Task } from '@/types/task';

export default function DashboardPage() {
  const { user } = useAuth();
  const dash = useDashboardQuery();
  const [editing, setEditing] = useState<Task | null>(null);

  if (dash.isLoading) return <Loading />;
  if (dash.isError || !dash.data) return <ErrorState onRetry={() => dash.refetch()} />;
  const d = dash.data;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back{user ? `, ${user.fullName.split(' ')[0]}` : ''}
        </h1>
        <p className="text-sm text-text-muted">{new Date().toDateString()}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard icon={ListTodo}      label="Total tasks"     value={d.totalTasks} />
        <SummaryCard icon={CheckCircle}   label="Completed"        value={d.completedTasks} tone="good" />
        <SummaryCard icon={Clock}         label="In progress"      value={d.inProgressTasks} />
        <SummaryCard icon={AlertTriangle} label="Overdue"          value={d.overdueTasks} tone="warn" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SummaryCard icon={Timer} label="Pomodoros today"  value={d.todayPomodoros} />
        <SummaryCard icon={Flame} label="Focus time today" value={minutesToHM(d.todayFocusMinutes)} tone="good" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-sm font-semibold">Today</h3>
          <TodayTasks tasks={d.todayTasks} onEdit={setEditing} />
        </Card>
        <UpcomingTasks tasks={d.upcomingTasks} onClick={setEditing} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentPomodoros sessions={d.recentSessions} />
        <CompletionMiniChart data={d.completionChart} />
      </div>

      <TaskFormModal open={!!editing} onClose={() => setEditing(null)} task={editing} />
    </div>
  );
}
