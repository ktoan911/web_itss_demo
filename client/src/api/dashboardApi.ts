import { api } from './axiosClient';

export const dashboardApi = {
  summary: () => api.get('/dashboard/summary').then((r) => r.data),
};
