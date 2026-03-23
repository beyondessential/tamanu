import { useMutation } from '@tanstack/react-query';
import { useApi } from '../../../../api';
import { DESIGNATION_ENDPOINT } from '../../constants';

export const useDesignationCreateMutation = useMutationOptions => {
  const api = useApi();

  return useMutation({
    mutationKey: ['designations', 'create'],
    mutationFn: async ({ code, id, name }) =>
      await api.post(DESIGNATION_ENDPOINT, {
        code: code.trim(),
        id: id.trim(),
        name: name.trim(),
      }),
    ...useMutationOptions,
  });
};
