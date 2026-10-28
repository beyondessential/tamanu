import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { route } from '@tamanu/api-client';

export const useLabRequestsQuery = (encounterId, query) => {
  const api = useApi();

  return useQuery(['encounterLabRequests', encounterId], () =>
    api.get(route('encounter/:encounterId/labRequests', { encounterId }), query),
  );
};
