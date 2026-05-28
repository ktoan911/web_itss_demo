import { api } from './axiosClient';
import type { StatRange, TaskStatsResponse, PomodoroStatsResponse } from '@/types/statistics';

export const statisticsApi = {
  tasks: (range: StatRange) =>
    api.get<TaskStatsResponse>('/statistics/tasks', { params: { range } }).then((r) => r.data),
  pomodoros: (range: StatRange) =>
    api.get<PomodoroStatsResponse>('/statistics/pomodoros', { params: { range } }).then((r) => r.data),
};
