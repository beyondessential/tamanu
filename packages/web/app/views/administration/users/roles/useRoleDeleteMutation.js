import { useMutation } from '@tanstack/react-query';
import { useApi } from '../../../../api';
import { ROLE_ENDPOINT } from '../../constants';
import { route } from '@tamanu/api-client';

export const useRoleDeleteMutation = useMutationOptions => {
  const api = useApi();

  return useMutation({
    mutationKey: ['roles', 'delete'],
    mutationFn: async roleId =>
      await api.delete(route(':ROLE_ENDPOINT/:roleId', { ROLE_ENDPOINT, roleId })),
    ...useMutationOptions,
  });
};
