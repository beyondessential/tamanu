import { useMutation } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useMarMutation = (existingMarId = null, useMutationOptions = {}) => {
  const api = useApi();

  return useMutation(
    payload =>
      existingMarId
        ? api.put(`medication/mar/${existingMarId}`, payload)
        : api.post('medication/mar', payload),
    {
      ...useMutationOptions,
      onSuccess: (data, variables, context) => {
        useMutationOptions.onSuccess?.(data, variables, context);
      },
    },
  );
};
