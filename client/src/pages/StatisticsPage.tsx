import { useState } from 'react';
import { Loading } from '@/components/common/Loading';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { RangeSelector } from '@/components/statistics/RangeSelector';
import { TaskCompletionChart } from '@/components/statistics/TaskCompletionChart';
import { PomodoroChart } from '@/components/statistics/PomodoroChart';
import { FocusMinutesChart } from '@/components/statistics/FocusMinutesChart';
import { PriorityPie } from '@/components/statistics/PriorityPie';
import { StatusPie } from '@/components/statistics/StatusPie';
import { usePomodoroStatsQuery, useTaskStatsQuery } from '@/hooks/queries/useStatisticsQueries';
import type { StatRange } from '@/types/statistics';

export default function StatisticsPage() {
  const [range, setRange] = useState<StatRange>('7days');
  const taskStats = useTaskStatsQuery(range);
  const pomoStats = usePomodoroStatsQuery(range);

  if (taskStats.isLoading || pomoStats.isLoading) return <Loading />;
  if (taskStats.isError || pomoStats.isError) {
    return <ErrorState onRetry={() => { taskStats.refetch(); pomoStats.refetch(); }} />;
  }

  const noData =
    (taskStats.data ?? []).every((d) => d.count === 0) &&
    (pomoStats.data?.daily ?? []).every((d) => d.sessions === 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Statistics</h1>
        <RangeSelector value={range} onChange={setRange} />
      </div>

      {noData ? (
        <EmptyState title="Not enough data yet" description="Complete some tasks or focus sessions to see stats." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TaskCompletionChart data={taskStats.data!} />
            <PomodoroChart data={pomoStats.data!.daily} />
          </div>
          <FocusMinutesChart data={pomoStats.data!.daily} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <PriorityPie data={pomoStats.data!.byPriority} />
            <StatusPie  data={pomoStats.data!.byStatus} />
          </div>
        </>
      )}
    </div>
  );
}
