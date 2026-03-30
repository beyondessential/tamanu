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

export const useValidateUserMutation = (options = {}) => {
  const api = useApi();

  return useMutation({
    mutationKey: ['users', 'validate'],
    mutationFn: payload => api.post('admin/users/validate', payload),
    ...options,
  });
};

export const useCheckOnLeaveMutation = (options = {}) => {
  const api = useApi();

  return useMutation({
    mutationKey: ['user', 'check-on-leave'],
    mutationFn: ({ userId, payload }) => api.post(`user/${userId}/check-on-leave`, payload),
    ...options,
  });
};

export const useDeleteUserDeviceMutation = (userId, options = {}) => {
  const api = useApi();

  return useMutation({
    mutationKey: ['users', userId, 'devices', 'delete'],
    mutationFn: deviceId => api.delete(`admin/users/${userId}/devices/${deviceId}`),
    ...options,
  });
};
