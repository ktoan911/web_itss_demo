import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/api/authApi';
import { useAuthStore } from '@/store/authStore';

export function useMeQuery() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    enabled: !!token,
  });
}

export function useLogin() {
  const login = useAuthStore((s) => s.login);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      login(data.token, data.user);
      qc.setQueryData(['auth', 'me'], data.user);
    },
  });
}

export function useRegister() {
  const login = useAuthStore((s) => s.login);
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => login(data.token, data.user),
  });
}
