import { useMutation } from '@tanstack/react-query';
import { useApi } from '../../../../api';
import { ROLE_ENDPOINT } from '../../constants';

export const useRoleDeleteMutation = useMutationOptions => {
  const api = useApi();

  return useMutation({
    mutationKey: ['roles', 'delete'],
    mutationFn: async roleId => await api.delete(`${ROLE_ENDPOINT}/${encodeURIComponent(roleId)}`),
    ...useMutationOptions,
  });
};
