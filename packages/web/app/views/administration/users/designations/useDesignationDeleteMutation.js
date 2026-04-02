import { useMutation } from '@tanstack/react-query';
import { useApi } from '../../../../api';
import { DESIGNATION_ENDPOINT } from '../../constants';

export const useDesignationDeleteMutation = useMutationOptions => {
  const api = useApi();

  return useMutation({
    mutationKey: ['designations', 'delete'],
    mutationFn: async designationId =>
      await api.delete(`${DESIGNATION_ENDPOINT}/${encodeURIComponent(designationId)}`),
    ...useMutationOptions,
  });
};
