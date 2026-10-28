import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { route } from '@tamanu/api-client';

export const useImagingRequestQuery = imagingRequestId => {
  const api = useApi();

  return useQuery(['imagingRequest', imagingRequestId], () =>
    api.get(route('imagingRequest/:imagingRequestId', { imagingRequestId })),
  );
};
