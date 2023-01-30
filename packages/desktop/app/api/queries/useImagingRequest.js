import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useImagingRequest = imagingRequestId => {
  const api = useApi();

  return useQuery(['useImagingRequest', imagingRequestId], () =>
    api.get(`imagingRequest/${encodeURIComponent(imagingRequestId)}`),
  );
};
