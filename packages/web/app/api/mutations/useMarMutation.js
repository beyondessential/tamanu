import { useMutation } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { route } from '@tamanu/api-client';

export const useNotGivenMarMutation = (existingMarId = null, useMutationOptions = {}) => {
  const api = useApi();

  return useMutation(
    payload =>
      existingMarId
        ? api.put(
            route('medication/medication-administration-record/:existingMarId/not-given', {
              existingMarId,
            }),
            payload,
          )
        : api.post('medication/medication-administration-record/not-given', payload),
    {
      ...useMutationOptions,
    },
  );
};

export const useNotGivenInfoMarMutation = (marId, useMutationOptions = {}) => {
  const api = useApi();

  return useMutation(
    payload =>
      api.put(
        route('medication/medication-administration-record/:marId/not-given-info', { marId }),
        payload,
      ),
    {
      ...useMutationOptions,
    },
  );
};

export const useGivenMarMutation = (existingMarId = null, useMutationOptions = {}) => {
  const api = useApi();

  return useMutation(
    payload =>
      existingMarId
        ? api.put(
            route('medication/medication-administration-record/:existingMarId/given', {
              existingMarId,
            }),
            payload,
          )
        : api.post('medication/medication-administration-record/given', payload),
    {
      ...useMutationOptions,
    },
  );
};

export const useUpdateMarMutation = (marId, useMutationOptions = {}) => {
  const api = useApi();

  return useMutation(
    payload =>
      api.put(route('medication/medication-administration-record/:marId', { marId }), payload),
    {
      ...useMutationOptions,
    },
  );
};

export const useUpdateDoseMutation = (doseId, useMutationOptions = {}) => {
  const api = useApi();
  return useMutation(
    payload =>
      api.put(
        route('medication/medication-administration-record/doses/:doseId', { doseId }),
        payload,
      ),
    {
      ...useMutationOptions,
    },
  );
};

export const useDeleteDoseMutation = (doseId, useMutationOptions = {}) => {
  const api = useApi();

  return useMutation(
    payload =>
      api.delete(
        route('medication/medication-administration-record/doses/:doseId', { doseId }),
        payload,
      ),
    {
      ...useMutationOptions,
    },
  );
};

export const useCreateMedicationSetMutation = (useMutationOptions = {}) => {
  const api = useApi();

  return useMutation(payload => api.post('medication/medication-set', payload), {
    ...useMutationOptions,
  });
};
