import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pomodoroApi } from '@/api/pomodoroApi';
import type { PomodoroCreateInput } from '@/types/pomodoro';

export function useRecentSessionsQuery() {
  return useQuery({ queryKey: ['pomodoros', 'recent'], queryFn: () => pomodoroApi.recent(10) });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: PomodoroCreateInput) => pomodoroApi.create(b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pomodoros'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['statistics'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
