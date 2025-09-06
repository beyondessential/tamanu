import { useMutation } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useOverlappingLeavesQuery = (options = {}) => {
  const api = useApi();

  return useMutation(
    (params) => api.post('admin/location-assignments/overlapping-leaves', params),
    {
      ...options,
    },
  );
};