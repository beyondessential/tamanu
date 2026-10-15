import { useMutation } from '@tanstack/react-query';
import { useApi } from '../../../../api';
import { ENDPOINT } from './constants';
import { route } from '@tamanu/api-client';

export const useReferenceDataEditMutation = (selectedType, useMutationOptions) => {
  const api = useApi();

  return useMutation({
    mutationKey: ['referenceData', 'edit', selectedType],
    mutationFn: async ({ id, ...data }) =>
      api.put(route(':ENDPOINT/:id', { ENDPOINT, id }), {
        referenceDataType: selectedType,
        ...data,
      }),
    ...useMutationOptions,
  });
};
