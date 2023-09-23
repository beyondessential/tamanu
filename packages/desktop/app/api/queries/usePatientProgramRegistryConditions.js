import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const usePatientProgramRegistryConditions = (patientProgramRegistryId, fetchOptions) => {
  const api = useApi();
  return useQuery(['PatientProgramRegistryConditions', patientProgramRegistryId], () =>
    api.get(
      `patient/programRegistration/${encodeURIComponent(patientProgramRegistryId)}/conditions`,
      fetchOptions,
    ),
  );
};
