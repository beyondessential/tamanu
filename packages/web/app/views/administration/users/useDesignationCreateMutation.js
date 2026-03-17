import { useMutation } from '@tanstack/react-query';
import { useApi } from '../../../api';
import { DESIGNATION_ENDPOINT } from '../constants';

export const useDesignationCreateMutation = useMutationOptions => {
  const api = useApi();

  return useMutation({
    mutationKey: ['userDesignations', 'create'],
    mutationFn: async ({ userId, designationId }) =>
      await api.post(DESIGNATION_ENDPOINT, {
        userId: userId.trim(),
        designationId: designationId.trim(),
      }),
    ...useMutationOptions,
  });
};
