import { api } from './axiosClient';
import type { DashboardSummary } from '@/types/dashboard';

export const dashboardApi = {
  summary: () => api.get<DashboardSummary>('/dashboard/summary').then((r) => r.data),
};
