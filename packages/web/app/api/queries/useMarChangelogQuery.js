import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useMarChangelogQuery = marId => {
  const api = useApi();
  return useQuery({
    queryKey: ['marChangelog', marId],
    queryFn: () => api.get(`medication/medication-administration-record/${marId}/changelog`),
    enabled: !!marId,
    refetchOnMount: true,
  });
};
