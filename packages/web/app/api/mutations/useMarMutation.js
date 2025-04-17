import { useMutation } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useNotGivenMarMutation = (existingMarId = null, useMutationOptions = {}) => {
  const api = useApi();

  return useMutation(
    payload =>
      existingMarId
        ? api.put(`medication/mar/${existingMarId}/notGiven`, payload)
        : api.post('medication/mar/notGiven', payload),
    {
      ...useMutationOptions,
      onSuccess: (data, variables, context) => {
        useMutationOptions.onSuccess?.(data, variables, context);
      },
    },
  );
};
