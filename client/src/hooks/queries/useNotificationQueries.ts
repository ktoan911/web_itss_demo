import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/api/notificationApi';
import { useAuthStore } from '@/store/authStore';

export function useNotificationsQuery() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['notifications'],
    queryFn: notificationApi.list,
    enabled: !!token,
    refetchInterval: 30_000,
  });
}

export function useMarkNotifRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllNotifRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
