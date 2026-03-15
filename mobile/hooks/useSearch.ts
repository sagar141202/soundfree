import { useQuery } from '@tanstack/react-query';
import { searchTracks } from '../lib/api';
import { useDebounce } from './useDebounce';

export function useSearch(query: string) {
  const debouncedQuery = useDebounce(query, 300);

  return useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchTracks(debouncedQuery),
    enabled: debouncedQuery.length > 1,
    staleTime: 1000 * 60 * 30,
    select: (data) => data ?? [],
  });
}
