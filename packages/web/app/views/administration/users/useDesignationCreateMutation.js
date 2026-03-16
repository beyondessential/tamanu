import { useMutation } from '@tanstack/react-query';
import { useApi } from '../../../api';
import { DESIGNATIONS_ENDPOINT } from '../constants';

export const useDesignationCreateMutation = useMutationOptions => {
  const api = useApi();

  return useMutation({
    mutationKey: ['designations', 'create'],
    mutationFn: async ({ id, name }) =>
      await api.post(DESIGNATIONS_ENDPOINT, { id: id.trim(), name: name.trim() }),
    ...useMutationOptions,
  });
};
