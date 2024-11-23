import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useUsersQuery = (options, useQueryOptions = {}) => {
  const api = useApi();

  return useQuery(['users'], () => api.get('user', options), useQueryOptions);
};
