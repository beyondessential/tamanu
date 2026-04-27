import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/Auth';
import { useApi } from '../useApi';

export const useSuggestionsQuery = (endpoint, options = {}) => {
  const api = useApi();
  const { facilityId } = useAuth();

  const queryParams = { noLimit: 'true' };
  if (facilityId) queryParams.facilityId = facilityId;

  return useQuery(
    ['suggestions', endpoint, facilityId],
    async () => await api.get(`suggestions/${endpoint}`, queryParams),
    {
      enabled: !!endpoint,
      ...options,
    },
  );
};
