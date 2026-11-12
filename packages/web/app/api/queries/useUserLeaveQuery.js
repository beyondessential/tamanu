import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { route } from '@tamanu/api-client';

export const useUserLeavesQuery = (userId, params = {}, useQueryOptions = {}) => {
  const api = useApi();

  return useQuery(
    ['userLeaves', userId],
    () => api.get(route('admin/users/:userId/leaves', { userId }), params),
    {
      enabled: !!userId,
      ...useQueryOptions,
    },
  );
};

export const useConflictingLocationAssignmentsQuery = (userId, params, useQueryOptions = {}) => {
  const api = useApi();

  return useQuery(
    ['conflictingLocationAssignments', userId, params],
    () =>
      api.get(route('admin/users/:userId/conflicting-location-assignments', { userId }), params),
    {
      enabled: !!userId && !!params?.after && !!params?.before,
      ...useQueryOptions,
    },
  );
};
