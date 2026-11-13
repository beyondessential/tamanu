import { useQuery } from '@tanstack/react-query';
import { route } from '@tamanu/api-client';
import { useApi } from '../useApi';

export const useLabRequestQuery = labRequestId => {
  const api = useApi();
  return useQuery({
    queryKey: ['labRequest', labRequestId],
    queryFn: async () => await api.get(route('labRequest/:labRequestId', { labRequestId })),
    enabled: Boolean(labRequestId),
  });
};
