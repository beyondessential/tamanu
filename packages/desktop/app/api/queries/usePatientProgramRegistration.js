import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const usePatientProgramRegistration = (patientId, programRegistryId, fetchOptions) => {
  const api = useApi();
  return useQuery(['infoPaneListItem-Program Registry', patientId, programRegistryId], () =>
    api.get(
      `patient/${encodeURIComponent(patientId)}/programRegistration/${encodeURIComponent(
        programRegistryId,
      )}`,
      fetchOptions,
    ),
  );
};
