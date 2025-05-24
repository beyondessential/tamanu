import { useApi } from '../useApi';
import { useQuery } from '@tanstack/react-query';

export const useEncounterPrescriptionsQuery = encounterId => {
  const api = useApi();
  return useQuery({
    queryKey: ['encounter-medications', encounterId],
    queryFn: () => api.get(`/encounter/${encounterId}/medications`),
    enabled: !!encounterId,
  });
};
