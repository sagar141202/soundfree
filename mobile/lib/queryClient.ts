import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: (failureCount, error: any) => {
        if (error?.message === 'OFFLINE') return false;
        return failureCount < 2;
      },
      retryDelay: 1000,
    },
  },
});
