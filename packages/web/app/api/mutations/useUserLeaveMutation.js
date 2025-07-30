import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useCreateUserLeaveMutation = (userId, options = {}) => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['userLeaves', userId],
    mutationFn: payload => api.post(`admin/users/${userId}/leaves`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['userLeaves', userId],
        exact: false,
      });
    },
    ...options,
  });
};

export const useDeleteUserLeaveMutation = (userId, leaveId, options = {}) => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['userLeaves', userId, leaveId],
    mutationFn: () => api.delete(`admin/users/${userId}/leaves/${leaveId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['userLeaves', userId],
        exact: false,
      });
    },
    ...options,
  });
};
