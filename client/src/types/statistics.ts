export type DailyTaskPoint = { date: string; count: number };
export type DailyPomodoroPoint = { date: string; sessions: number; focusMinutes: number };
export type PriorityCount = { priority: 'Low' | 'Medium' | 'High'; count: number };
export type StatusCount = { status: 'Todo' | 'InProgress' | 'Completed'; count: number };

export type TaskStatsResponse = DailyTaskPoint[];
export type PomodoroStatsResponse = {
  daily: DailyPomodoroPoint[];
  byPriority: PriorityCount[];
  byStatus: StatusCount[];
};

export type StatRange = '7days' | '30days' | 'month';
