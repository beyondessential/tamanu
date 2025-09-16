import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useLocationAssignmentMutation = (options = {}) => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation(
    assignment => {
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

export const useLocationAssignmentOverlappingAssignmentsMutation = () => {
  const api = useApi();

  return useMutation(payload => {
    return api.post('admin/location-assignments/overlapping-assignments', payload);
  });
};
