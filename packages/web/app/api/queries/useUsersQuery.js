import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useUsersQuery = options => {
  const api = useApi();

  return useQuery(['users'], () => api.get('user', options));
};
