export type Priority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'Todo' | 'InProgress' | 'Completed';

export type Task = {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  deadline: string; // ISO
  priority: Priority;
  status: TaskStatus;
  estimatedPomodoros: number;
  completedPomodoros: number;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  isOverdue: boolean;
  tags: string[];
};

export type TaskListQuery = {
  search?: string;
  status?: TaskStatus;
  priority?: Priority;
  deadlineFilter?: 'today' | 'upcoming' | 'overdue' | 'completed';
  sortBy?: 'deadline' | 'priority' | 'newest';
  tag?: string;
};

export type TaskCreateInput = {
  title: string;
  description?: string;
  deadline: string;
  priority: Priority;
  estimatedPomodoros: number;
  tags?: string[];
};
export type TaskUpdateInput = Partial<TaskCreateInput>;
