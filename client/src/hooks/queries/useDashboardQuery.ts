import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api/dashboardApi';
import type { DashboardSummary } from '@/types/dashboard';

export function useDashboardQuery() {
  return useQuery<DashboardSummary>({ queryKey: ['dashboard'], queryFn: dashboardApi.summary });
}
