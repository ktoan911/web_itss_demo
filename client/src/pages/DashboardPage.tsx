import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Clock, AlertTriangle, ListTodo, Timer, Flame } from 'lucide-react';
import { Loading } from '@/components/common/Loading';
import { ErrorState } from '@/components/common/ErrorState';
import { Card } from '@/components/common/Card';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { StreakCard } from '@/components/dashboard/StreakCard';
import { TodayTasks } from '@/components/dashboard/TodayTasks';
import { UpcomingTasks } from '@/components/dashboard/UpcomingTasks';
import { RecentPomodoros } from '@/components/dashboard/RecentPomodoros';
import { CompletionMiniChart } from '@/components/dashboard/CompletionMiniChart';
import { DeadlineBanner } from '@/components/dashboard/DeadlineBanner';
import { InfoTooltip } from '@/components/common/InfoTooltip';
import { TaskFormModal } from '@/components/tasks/TaskFormModal';
import { useDashboardQuery } from '@/hooks/queries/useDashboardQuery';
import { useAuth } from '@/hooks/useAuth';
import { minutesToHM } from '@/utils/dateUtils';
import type { Task } from '@/types/task';

export default function DashboardPage() {
  const { t } = useTranslation('dashboard');
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
          {user
            ? t('greeting.welcomeName', { name: user.fullName.split(' ')[0] })
            : t('greeting.welcome')}
        </h1>
        <p className="text-sm text-text-muted">{new Date().toDateString()}</p>
      </div>

      <DeadlineBanner
        overdueCount={d.overdueTasks}
        dueSoonTasks={d.dueSoonTasks}
        dueSoonHours={d.dueSoonHours}
        onSelect={setEditing}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard icon={ListTodo}      label={t('summary.totalTasks')}     value={d.totalTasks} />
        <SummaryCard icon={CheckCircle}   label={t('summary.completed')}        value={d.completedTasks} tone="good" />
        <SummaryCard icon={Clock}         label={t('summary.inProgress')}      value={d.inProgressTasks} />
        <SummaryCard icon={AlertTriangle} label={t('summary.overdue')}          value={d.overdueTasks} tone="warn" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StreakCard streak={d.streak} />
        <SummaryCard icon={Timer} label={t('summary.pomodorosToday')}  value={d.todayPomodoros} />
        <SummaryCard icon={Flame} label={t('summary.focusTimeToday')} value={minutesToHM(d.todayFocusMinutes)} tone="good" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
            {t('today.title')}
            <InfoTooltip text={t('today.tooltip')} />
          </h3>
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
