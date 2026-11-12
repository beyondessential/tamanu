import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { route } from '@tamanu/api-client';

export const useMarChangelogQuery = marId => {
  const api = useApi();
  return useQuery({
    queryKey: ['marChangelog', marId],
    queryFn: () =>
      api.get(route('medication/medication-administration-record/:marId/changelog', { marId })),
    enabled: !!marId,
    refetchOnMount: true,
  });
};
