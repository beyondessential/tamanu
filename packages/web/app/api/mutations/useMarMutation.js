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

export const useUpdateMarMutation = (marId, useMutationOptions = {}) => {
  const api = useApi();

  return useMutation(
    payload => api.put(`medication/medication-administration-record/${marId}`, payload),
    {
      ...useMutationOptions,
    },
  );
};

export const useDeleteDoseMutation = (doseId, useMutationOptions = {}) => {
  const api = useApi();

  return useMutation(
    payload => api.delete(`medication/medication-administration-record/doses/${doseId}`, payload),
    {
      ...useMutationOptions,
    },
  );
};
