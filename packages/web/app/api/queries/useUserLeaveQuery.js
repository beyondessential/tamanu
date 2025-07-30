import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useUserLeavesQuery = (userId, options = {}, useQueryOptions = {}) => {
  console.log('useUserLeavesQuery userId', userId);
  const api = useApi();

  return useQuery(
    ['userLeaves', userId],
    () => api.get(`admin/users/${userId}/leaves`, options),
    {
      enabled: !!userId,
      ...useQueryOptions,
    },
  );
};
