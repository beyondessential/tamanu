import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/Auth';
import { useApi } from '../useApi';
import { route } from '@tamanu/api-client';

export const useSuggestionsQuery = (endpoint, options = {}) => {
  const api = useApi();
  const { facilityId } = useAuth();

  const queryParams = { noLimit: 'true' };
  if (facilityId) queryParams.facilityId = facilityId;

  return useQuery(
    ['suggestions', endpoint, facilityId],
    async () => await api.get(route('suggestions/:endpoint', { endpoint }), queryParams),
    {
      enabled: !!endpoint,
      ...options,
    },
  );
};
