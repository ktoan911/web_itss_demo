import type { Priority, TaskStatus } from '@/types/task';
import { cn } from '@/utils/cn';

const priorityClass: Record<Priority, string> = {
  Low: 'bg-priority-low/15 text-priority-low',
  Medium: 'bg-priority-medium/15 text-priority-medium',
  High: 'bg-priority-high/15 text-priority-high',
};
const statusClass: Record<TaskStatus, string> = {
  Todo: 'bg-status-todo/15 text-status-todo',
  InProgress: 'bg-status-progress/15 text-status-progress',
  Completed: 'bg-status-done/15 text-status-done',
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', priorityClass[priority])}>{priority}</span>;
}
export function StatusBadge({ status }: { status: TaskStatus }) {
  const label = status === 'InProgress' ? 'In progress' : status;
  return <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', statusClass[status])}>{label}</span>;
}
export function OverdueBadge() {
  return <span className="inline-flex rounded-full bg-status-overdue/15 px-2 py-0.5 text-xs font-medium text-status-overdue">Overdue</span>;
}
