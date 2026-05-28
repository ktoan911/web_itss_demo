import { api } from './axiosClient';
import type { AuthResponse, User } from '@/types/auth';

export const authApi = {
  register: (body: { fullName: string; email: string; password: string; confirmPassword: string }) =>
    api.post<AuthResponse>('/auth/register', body).then((r) => r.data),
  login: (body: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', body).then((r) => r.data),
  me: () => api.get<{ user: User }>('/auth/me').then((r) => r.data.user),
};
