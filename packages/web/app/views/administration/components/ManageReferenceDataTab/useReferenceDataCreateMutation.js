import { useMutation } from '@tanstack/react-query';
import { useApi } from '../../../../api';
import { ENDPOINT } from './constants';

export const useReferenceDataCreateMutation = (selectedType, useMutationOptions) => {
  const api = useApi();

  return useMutation({
    mutationKey: ['referenceData', 'create', selectedType],
    mutationFn: async data => api.post(ENDPOINT, { ...data, referenceDataType: selectedType }),
    ...useMutationOptions,
  });
};
