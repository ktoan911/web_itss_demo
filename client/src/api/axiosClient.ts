import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { queryClient } from '@/lib/queryClient';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15_000,
});

api.interceptors.request.use((cfg) => {
  const token = useAuthStore.getState().token;
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const url = err.config?.url ?? '';
    if (err.response?.status === 401 && !url.includes('/auth/')) {
      useAuthStore.getState().logout();
      queryClient.clear();
      if (window.location.pathname !== '/login') window.location.assign('/login');
    }
    return Promise.reject(err);
  },
);
