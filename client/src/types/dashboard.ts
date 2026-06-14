import type { Task } from '@/types/task';
import type { PomodoroSession } from '@/types/pomodoro';

export type CompletionPoint = { date: string; count: number };

export type DashboardSummary = {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  todayPomodoros: number;
  todayFocusMinutes: number;
  todayTasks: Task[];
  upcomingTasks: Task[];
  recentSessions: PomodoroSession[];
  completionChart: CompletionPoint[];
  dueSoonTasks: Task[];
  dueSoonHours: number;
  streak: number;
};
