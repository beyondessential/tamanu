import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useImagingRequestsQuery = (encounterId) => {
  const api = useApi();

  return useQuery(['encounterImagingRequests', encounterId], () =>
    api.get(`encounter/${encodeURIComponent(encounterId)}/imagingRequests`),
  );
};
