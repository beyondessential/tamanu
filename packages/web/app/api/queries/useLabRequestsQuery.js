import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useLabRequestsQuery = (encounterId, query) => {
  const api = useApi();

  return useQuery(['encounterLabRequests', encounterId], () =>
    api.get(`encounter/${encodeURIComponent(encounterId)}/labRequests`, query),
  );
};
