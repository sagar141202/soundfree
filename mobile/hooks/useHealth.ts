import { useQuery } from '@tanstack/react-query';
import { checkHealth } from '../lib/api';

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: checkHealth,
    retry: false,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
}
