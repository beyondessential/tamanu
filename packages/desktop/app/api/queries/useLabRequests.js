import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useLabRequests = (encounterId, query) => {
  const api = useApi();

  return useQuery(['useLabRequests', encounterId], () =>
    api.get(`encounter/${encodeURIComponent(encounterId)}/labRequests`, query),
  );
};
