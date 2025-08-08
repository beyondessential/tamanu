import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useUserLeavesQuery = (userId, params = {}, useQueryOptions = {}) => {
  const api = useApi();

  return useQuery(
    ['userLeaves', userId],
    () => api.get(`admin/users/${userId}/leaves`, params),
    {
      enabled: !!userId,
      ...useQueryOptions,
    },
  );
};
