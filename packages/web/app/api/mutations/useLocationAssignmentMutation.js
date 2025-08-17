import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useLocationAssignmentMutation = (options = {}) => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation(
    (assignment) => {
      if (assignment.id) {
        return api.put(`admin/location-assignments/${assignment.id}`, assignment);
      }
      return api.post('admin/location-assignments', assignment);
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

export const useDeleteLocationAssignmentMutation = (options = {}) => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation(
    ({ id, deleteFuture = false }) => {
      return api.delete(`admin/location-assignments/${id}`, {
        params: { deleteFuture },
      });
    },
    {
      onSuccess: () => {
        // Invalidate and refetch all locationAssignments queries to immediately show new data
        queryClient.invalidateQueries({
          queryKey: ['locationAssignments'],
          exact: false,
        });
        queryClient.refetchQueries({
          queryKey: ['locationAssignments'],
          exact: false,
        });
      },
      ...options,
    },
  );
};