import { useMutation } from '@tanstack/react-query';
import { useApi } from '../../../../api';
import { DESIGNATION_ENDPOINT } from '../../constants';
import { route } from '@tamanu/api-client';

export const useDesignationDeleteMutation = useMutationOptions => {
  const api = useApi();

  return useMutation({
    mutationKey: ['designations', 'delete'],
    mutationFn: async designationId =>
      await api.delete(route(`${DESIGNATION_ENDPOINT}/:designationId`, { designationId })),
    ...useMutationOptions,
  });
};
