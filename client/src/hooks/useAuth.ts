import { useAuthStore } from '@/store/authStore';
import { useQueryClient } from '@tanstack/react-query';

export function useAuth() {
  const { token, user, logout: storeLogout } = useAuthStore();
  const qc = useQueryClient();
  function logout() {
    storeLogout();
    qc.clear();
  }
  return { token, user, isAuthenticated: !!token, logout };
}
