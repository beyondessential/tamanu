import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { route } from '@tamanu/api-client';

export const useImagingRequestsQuery = encounterId => {
  const api = useApi();

  return useQuery(['encounterImagingRequests', encounterId], () =>
    api.get(route('encounter/:encounterId/imagingRequests', { encounterId })),
  );
};
