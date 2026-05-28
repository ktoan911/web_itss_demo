export type NotificationType =
  | 'task_overdue' | 'task_completed' | 'pomodoro_done' | 'deadline_soon' | 'estimated_reached';

export type Notification = {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  taskId?: string | null;
  isRead: boolean;
  createdAt: string;
};
