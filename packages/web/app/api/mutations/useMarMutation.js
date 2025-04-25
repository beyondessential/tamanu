import { useMutation } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useNotGivenMarMutation = (existingMarId = null, useMutationOptions = {}) => {
  const api = useApi();

  return useMutation(
    payload =>
      existingMarId
        ? api.put(`medication/medication-administration-record/${existingMarId}/not-given`, payload)
        : api.post('medication/medication-administration-record/not-given', payload),
    {
      ...useMutationOptions,
      onSuccess: (data, variables, context) => {
        useMutationOptions.onSuccess?.(data, variables, context);
      },
    },
  );
};

export const useGivenMarMutation = (existingMarId = null, useMutationOptions = {}) => {
  const api = useApi();

  return useMutation(
    payload =>
      existingMarId
        ? api.put(`medication/medication-administration-record/${existingMarId}/given`, payload)
        : api.post('medication/medication-administration-record/given', payload),
    {
      ...useMutationOptions,
      onSuccess: (data, variables, context) => {
        useMutationOptions.onSuccess?.(data, variables, context);
      },
    },
  );
};

export const useCreateDosesMutation = (marId, useMutationOptions = {}) => {
  const api = useApi();

  return useMutation(
    payload => api.post(`medication/medication-administration-record/${marId}/doses`, payload),
    {
      ...useMutationOptions,
      onSuccess: (data, variables, context) => {
        useMutationOptions.onSuccess?.(data, variables, context);
      },
    },
  );
};
