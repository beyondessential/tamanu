import { useMutation } from '@tanstack/react-query';
import { useApi } from '../../../../api';
import { ENDPOINT } from './constants';

export const useReferenceDataEditMutation = (selectedType, useMutationOptions) => {
  const api = useApi();

  return useMutation({
    mutationKey: ['referenceData', 'edit', selectedType],
    mutationFn: async ({ id, ...data }) => api.put(`${ENDPOINT}/${encodeURIComponent(id)}`, { referenceDataType: selectedType, ...data }),
    ...useMutationOptions,
  });
};
