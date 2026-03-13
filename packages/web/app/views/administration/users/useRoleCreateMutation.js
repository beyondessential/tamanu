import { useMutation } from '@tanstack/react-query';
import { useApi } from '../../../api';
import { ROLES_ENDPOINT } from '../constants';

export const useRoleCreateMutation = useMutationOptions => {
  const api = useApi();

  return useMutation({
    mutationKey: ['roles', 'create'],
    mutationFn: async ({ id, name }) =>
      await api.post(ROLES_ENDPOINT, { id: id.trim(), name: name.trim() }),
    ...useMutationOptions,
  });
};
