import { useMutation } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useOverlappingLeavesQuery = (options = {}) => {
  const api = useApi();

  return useMutation(
    (params) => api.get('admin/location-assignments/overlapping-leaves', params),
    {
      ...options,
    },
  );
};