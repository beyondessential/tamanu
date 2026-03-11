import { useQuery } from '@tanstack/react-query';
import { useApi } from '../index';

export const useFacilityQuery = (facilityId, options = {}) => {
  const api = useApi();

  return useQuery(
    ['facility', facilityId],
    () => api.get(`facility/${encodeURIComponent(facilityId)}`),
    {
      enabled: Boolean(facilityId) && (options.enabled ?? true),
      ...options,
    },
  );
};
