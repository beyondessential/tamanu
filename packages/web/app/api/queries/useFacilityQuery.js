import { useQuery } from '@tanstack/react-query';
import { useApi } from '../index';
import { route } from '@tamanu/api-client';

export const useFacilityQuery = (facilityId, options = {}) => {
  const api = useApi();

  return useQuery(
    ['facility', facilityId],
    () => api.get(route('facility/:facilityId', { facilityId })),
    {
      enabled: Boolean(facilityId) && (options.enabled ?? true),
      ...options,
    },
  );
};
