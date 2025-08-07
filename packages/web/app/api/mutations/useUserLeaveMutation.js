import { useMutation } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useCreateUserLeaveMutation = (userId, options = {}) => {
  const api = useApi();

  return useMutation({
    mutationKey: ['userLeaves', userId],
    mutationFn: payload => api.post(`admin/users/${userId}/leaves`, payload),
    ...options,
  });
};

export const useDeleteUserLeaveMutation = (userId, options = {}) => {
  const api = useApi();

  return useMutation({
    mutationKey: ['userLeaves', userId],
    mutationFn: leaveId => api.delete(`admin/users/${userId}/leaves/${leaveId}`),
    ...options,
  });
};
