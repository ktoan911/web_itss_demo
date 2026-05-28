import { api } from './axiosClient';
import type { Task, TaskCreateInput, TaskListQuery, TaskUpdateInput, TaskStatus } from '@/types/task';

export const taskApi = {
  list: (q: TaskListQuery = {}) => api.get<Task[]>('/tasks', { params: q }).then((r) => r.data),
  get: (id: string) => api.get<Task>(`/tasks/${id}`).then((r) => r.data),
  create: (b: TaskCreateInput) => api.post<Task>('/tasks', b).then((r) => r.data),
  update: (id: string, b: TaskUpdateInput) => api.put<Task>(`/tasks/${id}`, b).then((r) => r.data),
  remove: (id: string) => api.delete(`/tasks/${id}`).then((r) => r.data),
  changeStatus: (id: string, status: TaskStatus) =>
    api.patch<Task>(`/tasks/${id}/status`, { status }).then((r) => r.data),
  markCompleted: (id: string) => api.patch<Task>(`/tasks/${id}/complete`).then((r) => r.data),
  incrementPomodoro: (id: string) =>
    api.patch<Task>(`/tasks/${id}/pomodoro/increment`).then((r) => r.data),
};
