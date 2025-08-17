import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useLocationAssignmentsQuery = (params, options = {}) => {
  const api = useApi();
  
  return useQuery(
    ['locationAssignments', params],
    () => api.get('admin/location-assignments', { params }),
    {
      ...options,
    },
  );
};
