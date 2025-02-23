import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useLocationsQuery = (options, useQueryOptions) => {
  const api = useApi();
  return useQuery(['locations', options], () => api.get('location', options), useQueryOptions);
};
