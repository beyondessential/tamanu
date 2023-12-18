import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const usePatientProgramRegistryConditions = (patientId, programRegistryId, fetchOptions) => {
  const api = useApi();
  return useQuery(['PatientProgramRegistryConditions', programRegistryId], () =>
    api.get(
      `patient/${encodeURIComponent(patientId)}/programRegistration/${encodeURIComponent(
        programRegistryId,
      )}/condition`,
      fetchOptions,
    ),
  );
};
