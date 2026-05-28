import { api } from './axiosClient';
import type { PomodoroSession, PomodoroCreateInput } from '@/types/pomodoro';

export const pomodoroApi = {
  create: (b: PomodoroCreateInput) =>
    api.post<PomodoroSession>('/pomodoro-sessions', b).then((r) => r.data),
  recent: (limit = 10) =>
    api.get<PomodoroSession[]>('/pomodoro-sessions/recent', { params: { limit } })
      .then((r) => r.data),
};
