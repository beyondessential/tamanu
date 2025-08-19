import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useLocationAssignmentsQuery = (params, options = {}) => {
  const api = useApi();
  
  return useQuery(
    ['locationAssignments'],
    () => api.get('admin/location-assignments', { params }),
    {
      ...options,
    },
  );
};
