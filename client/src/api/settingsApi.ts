import { api } from './axiosClient';
import type { Settings, SettingsUpdateInput } from '@/types/settings';
import type { User } from '@/types/auth';

export const settingsApi = {
  get: () => api.get<Settings>('/settings').then((r) => r.data),
  update: (b: SettingsUpdateInput) => api.put<Settings>('/settings', b).then((r) => r.data),
  updateProfile: (b: { fullName: string }) =>
    api.put<User>('/settings/profile', b).then((r) => r.data),
  changePassword: (b: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    api.put<{ ok: true }>('/settings/password', b).then((r) => r.data),
};
