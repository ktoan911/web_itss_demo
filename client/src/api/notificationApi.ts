import { api } from './axiosClient';
import type { Notification } from '@/types/notification';

export const notificationApi = {
  list: () => api.get<Notification[]>('/notifications').then((r) => r.data),
  markRead: (id: string) =>
    api.patch<Notification>(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () =>
    api.patch<{ count: number }>('/notifications/read-all').then((r) => r.data),
};
