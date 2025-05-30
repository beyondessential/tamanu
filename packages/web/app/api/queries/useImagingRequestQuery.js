import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useImagingRequestQuery = (imagingRequestId) => {
  const api = useApi();

  return useQuery(['imagingRequest', imagingRequestId], () =>
    api.get(`imagingRequest/${encodeURIComponent(imagingRequestId)}`),
  );
};
