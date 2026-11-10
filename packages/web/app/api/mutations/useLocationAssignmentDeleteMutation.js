import { useMutation, useQueryClient } from '@tanstack/react-query';
import { route } from '@tamanu/api-client';
import { useApi } from '../useApi';

export const useLocationAssignmentDeleteMutation = (options = {}) => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation(
    ({ id, deleteFuture = false }) =>
      api.delete(
        route('admin/location-assignments/:id', { id }),
        deleteFuture ? { deleteAllNextRecords: true } : {},
      ),
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
