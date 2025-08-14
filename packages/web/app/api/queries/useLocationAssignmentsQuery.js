import { useQuery } from '@tanstack/react-query';

import { useApi } from '../useApi';

export const useLocationAssignmentsQuery = (fetchOptions, useQueryOptions = {}) => {
  const api = useApi();
  return useQuery(
    ['location-assignments', fetchOptions],
    () => api.get('admin/location-assignments', fetchOptions),
    useQueryOptions,
  );
};