import { useMutation } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { route } from '@tamanu/api-client';

export const useCreateUserLeaveMutation = (userId, options = {}) => {
  const api = useApi();

  return useMutation({
    mutationKey: ['userLeaves', userId],
    mutationFn: payload => api.post(route('admin/users/:userId/leaves', { userId }), payload),
    ...options,
  });
};

export const useDeleteUserLeaveMutation = (userId, options = {}) => {
  const api = useApi();

  return useMutation({
    mutationKey: ['userLeaves', userId],
    mutationFn: leaveId =>
      api.delete(route('admin/users/:userId/leaves/:leaveId', { userId, leaveId })),
    ...options,
  });
};
