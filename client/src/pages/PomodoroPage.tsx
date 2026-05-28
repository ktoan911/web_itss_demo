import { useMemo } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/common/Card';
import { PomodoroModeTabs } from '@/components/pomodoro/PomodoroModeTabs';
import { FocusTaskSelector } from '@/components/pomodoro/FocusTaskSelector';
import { PomodoroTimer } from '@/components/pomodoro/PomodoroTimer';
import { PomodoroHistoryList } from '@/components/pomodoro/PomodoroHistoryList';
import { EstimateReachedDialog } from '@/components/pomodoro/EstimateReachedDialog';
import { useRecentSessionsQuery } from '@/hooks/queries/usePomodoroQueries';
import { useTasksQuery, useMarkComplete } from '@/hooks/queries/useTaskQueries';
import { usePomodoroStore } from '@/store/pomodoroStore';

export default function PomodoroPage() {
  const tasks = useTasksQuery({ status: undefined, sortBy: 'deadline' });
  const sessions = useRecentSessionsQuery();
  const complete = useMarkComplete();

  const mode = usePomodoroStore((s) => s.mode);
  const status = usePomodoroStore((s) => s.status);
  const setMode = usePomodoroStore((s) => s.setMode);
  const reset = usePomodoroStore((s) => s.reset);
  const selectTask = usePomodoroStore((s) => s.selectTask);
  const selectedTaskId = usePomodoroStore((s) => s.selectedTaskId);
  const estimateTaskId = usePomodoroStore((s) => s.estimateReachedTaskId);
  const ack = usePomodoroStore((s) => s.acknowledgeEstimate);

  const focusables = useMemo(
    () => (tasks.data ?? []).filter((t) => t.status !== 'Completed'),
    [tasks.data],
  );
  const selectedTask = focusables.find((t) => t._id === selectedTaskId) || null;
  const estimateTask = (tasks.data ?? []).find((t) => t._id === estimateTaskId) || null;
  const showEstimate =
    !!estimateTaskId &&
    !!estimateTask &&
    estimateTask.status !== 'Completed' &&
    estimateTask.completedPomodoros >= estimateTask.estimatedPomodoros;

  const onModeChange = (m: typeof mode) => {
    if (status !== 'idle') {
      const ok = window.confirm('Switch will reset the timer. Continue?');
      if (!ok) return;
      reset();
    }
    setMode(m);
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[2fr,1fr]">
      <Card>
        <div className="flex flex-col items-center gap-6">
          <PomodoroModeTabs mode={mode} onChange={onModeChange} />
          <PomodoroTimer taskTitle={selectedTask?.title} />
          <FocusTaskSelector tasks={focusables} value={selectedTaskId} onChange={selectTask} />
        </div>
      </Card>
      <Card>
        <h2 className="mb-3 text-sm font-semibold">Recent sessions</h2>
        <PomodoroHistoryList sessions={sessions.data ?? []} />
      </Card>

      <EstimateReachedDialog
        open={showEstimate}
        taskTitle={estimateTask?.title}
        onKeepGoing={ack}
        onMarkComplete={() => {
          if (!estimateTask) return ack();
          complete.mutate(estimateTask._id, {
            onSuccess: () => { toast.success('Task completed'); ack(); },
            onError: () => { toast.error('Failed to complete'); ack(); },
          });
        }}
      />
    </div>
  );
}
