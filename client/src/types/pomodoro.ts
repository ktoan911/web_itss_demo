export type PomodoroMode = 'Focus' | 'ShortBreak' | 'LongBreak';

export type PomodoroSession = {
  _id: string;
  userId: string;
  taskId: string | null;
  mode: PomodoroMode;
  durationMinutes: number;
  startedAt: string;
  endedAt?: string | null;
  isCompleted: boolean;
  createdAt: string;
};

export type PomodoroCreateInput = {
  taskId?: string | null;
  mode: PomodoroMode;
  durationMinutes: number;
  startedAt: string;
  endedAt: string;
  isCompleted: boolean;
};
