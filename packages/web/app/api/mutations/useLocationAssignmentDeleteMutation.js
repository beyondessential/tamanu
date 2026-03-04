import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useLocationAssignmentDeleteMutation = (options = {}) => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation(
    ({ id, deleteFuture = false }) => {
      const params = deleteFuture ? '?deleteAllNextRecords=true' : '';
      return api.delete(`admin/location-assignments/${id}${params}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['locationAssignments'],
          exact: false,
        });
      },
      ...options,
    },
  );
};
