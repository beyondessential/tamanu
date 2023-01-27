import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useImagingRequests = encounterId => {
  const api = useApi();

  return useQuery(['useImagingRequests', encounterId], () =>
    api.get(`encounter/${encodeURIComponent(encounterId)}/imagingRequests`),
  );
};
