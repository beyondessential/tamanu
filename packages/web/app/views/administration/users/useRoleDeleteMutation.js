import { useMutation } from '@tanstack/react-query';
import { useApi } from '../../../api';

export const useRoleDeleteMutation = useMutationOptions => {
  const api = useApi();

  return useMutation({
    mutationKey: ['roles', 'delete'],
    mutationFn: async roleId => await api.delete(`admin/role/${encodeURIComponent(roleId)}`),
    ...useMutationOptions,
  });
};
