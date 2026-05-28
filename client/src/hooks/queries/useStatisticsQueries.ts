import { useQuery } from '@tanstack/react-query';
import { statisticsApi } from '@/api/statisticsApi';
import type { StatRange } from '@/types/statistics';

export function useTaskStatsQuery(range: StatRange) {
  return useQuery({ queryKey: ['statistics', 'tasks', range], queryFn: () => statisticsApi.tasks(range) });
}
export function usePomodoroStatsQuery(range: StatRange) {
  return useQuery({ queryKey: ['statistics', 'pomodoros', range], queryFn: () => statisticsApi.pomodoros(range) });
}
