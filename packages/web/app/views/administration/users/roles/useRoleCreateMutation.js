import { useMutation } from '@tanstack/react-query';
import { useApi } from '../../../../api';
import { ROLE_ENDPOINT } from '../../constants';

export const useRoleCreateMutation = useMutationOptions => {
  const api = useApi();

  return useMutation({
    mutationKey: ['roles', 'create'],
    mutationFn: async ({ id, name }) =>
      await api.post(ROLE_ENDPOINT, { id: id.trim(), name: name.trim() }),
    ...useMutationOptions,
  });
};
