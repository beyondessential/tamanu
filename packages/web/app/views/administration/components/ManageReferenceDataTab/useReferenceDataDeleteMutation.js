import { useMutation } from '@tanstack/react-query';
import { useApi } from '../../../../api';
import { ENDPOINT } from './constants';

export const useReferenceDataDeleteMutation = useMutationOptions => {
  const api = useApi();

  return useMutation({
    mutationKey: ['referenceData', 'delete'],
    mutationFn: async id => api.delete(`${ENDPOINT}/${encodeURIComponent(id)}`),
    ...useMutationOptions,
  });
};
