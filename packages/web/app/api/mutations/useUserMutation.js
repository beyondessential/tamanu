import { useMutation } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useUpdateUserMutation = (userId, options = {}) => {
  const api = useApi();

  return useMutation({
    mutationKey: ['users', userId],
    mutationFn: payload => api.put(`admin/users/${userId}`, payload),
    ...options,
  });
};

export const useCreateUserMutation = (options = {}) => {
  const api = useApi();

  return useMutation({
    mutationKey: ['users', 'create'],
    mutationFn: payload => api.post('admin/users', payload),
    ...options,
  });
};
