import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useMarDoses = marId => {
  const api = useApi();
  return useQuery({
    queryKey: ['marDoses', marId],
    queryFn: async () =>
      await api.get(
        `medication/medication-administration-record/${encodeURIComponent(marId)}/doses`,
      ),
    enabled: Boolean(marId),
    staleTime: 60_000,
  });
};
