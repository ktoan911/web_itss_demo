import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/api/settingsApi';
import type { SettingsUpdateInput } from '@/types/settings';
import { useAuthStore } from '@/store/authStore';

export function useSettingsQuery() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
    enabled: !!token,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: SettingsUpdateInput) => settingsApi.update(b),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (b: { fullName: string }) => settingsApi.updateProfile(b),
    onSuccess: (user) => {
      setUser({ id: (user as any)._id ?? (user as any).id, fullName: user.fullName, email: user.email });
      qc.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: settingsApi.changePassword,
  });
}
