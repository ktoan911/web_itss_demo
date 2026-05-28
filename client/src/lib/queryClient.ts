import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (n, err: any) => err?.response?.status === 401 ? false : n < 2,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
});
