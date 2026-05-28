import type { Priority, Task, TaskStatus } from '@/types/task';

export const priorityColor: Record<Priority, string> = {
  Low: 'priority-low',
  Medium: 'priority-medium',
  High: 'priority-high',
};

export const statusBadgeText: Record<TaskStatus, string> = {
  Todo: 'To do',
  InProgress: 'In progress',
  Completed: 'Completed',
};

export const isOverdue = (t: Pick<Task, 'deadline' | 'status'>): boolean =>
  new Date(t.deadline) < new Date() && t.status !== 'Completed';

export const priorityRank: Record<Priority, number> = { Low: 1, Medium: 2, High: 3 };
