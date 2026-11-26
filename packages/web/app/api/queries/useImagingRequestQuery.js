import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { useAuth } from '../../contexts/Auth';
import { route } from '@tamanu/api-client';

export const useImagingRequestQuery = imagingRequestId => {
  const api = useApi();
  const { facilityId } = useAuth();

  return useQuery(['imagingRequest', imagingRequestId, facilityId], () =>
    api.get(route('imagingRequest/:imagingRequestId', { imagingRequestId }), { facilityId }),
  );
};
