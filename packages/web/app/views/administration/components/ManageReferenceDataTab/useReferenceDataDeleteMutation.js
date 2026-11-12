import { useMutation } from '@tanstack/react-query';
import { useApi } from '../../../../api';
import { ENDPOINT } from './constants';
import { route } from '@tamanu/api-client';

export const useReferenceDataDeleteMutation = useMutationOptions => {
  const api = useApi();

  return useMutation({
    mutationKey: ['referenceData', 'delete'],
    mutationFn: async id => api.delete(route(`${ENDPOINT}/:id`, { id })),
    ...useMutationOptions,
  });
};
