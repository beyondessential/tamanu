import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useLocationGroupsQuery = options => {
  const api = useApi();

  return useQuery(['locationGroups'], () => api.get('locationGroup', options));
};
