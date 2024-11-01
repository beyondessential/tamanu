import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useUsersQuery = (options, queryOptions = {}) => {
  const api = useApi();

  return useQuery(['users'], () => api.get('user', options), queryOptions);
};
