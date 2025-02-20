import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useProgramRegistryClinicalStatusQuery = (
  patientId,
  programRegistryId,
  fetchOptions,
) => {
  const api = useApi();

  return useQuery(['patient', patientId, 'programRegistration', programRegistryId, 'history'], () =>
    api.get(
      `patient/${encodeURIComponent(patientId)}/programRegistration/${encodeURIComponent(
        programRegistryId,
      )}/history`,
      fetchOptions,
    ),
  );
};
