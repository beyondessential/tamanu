import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../../api/useApi';

export default function useMarDoses(marId) {
  const api = useApi();
  return useQuery({
    queryKey: ['marDoses', marId],
    queryFn: async () =>
      (
        await api.get(
          `medication/medication-administration-record/${encodeURIComponent(marId)}/doses`,
        )
      ).data,
    enabled: Boolean(marId),
    /** MAR hits this endpoint a lot, so rely on proper cache invalidation when data is mutated */
    staleTime: 600_000,
  });
}
