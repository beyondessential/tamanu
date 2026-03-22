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

export const useConflictingLocationAssignmentsQuery = (userId, params, useQueryOptions = {}) => {
  const api = useApi();

  return useQuery(
    ['conflictingLocationAssignments', userId, params],
    () => api.get(`admin/users/${userId}/conflicting-location-assignments`, params),
    {
      enabled: !!userId && !!params?.after && !!params?.before,
      ...useQueryOptions,
    },
  );
};
