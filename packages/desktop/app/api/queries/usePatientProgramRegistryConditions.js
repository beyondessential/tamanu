import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const usePatientProgramRegistryConditions = (programRegistryId, fetchOptions) => {
  const api = useApi();
  return useQuery(['PatientProgramRegistryConditions', programRegistryId], () =>
    api.get(
      `patient/programRegistration/${encodeURIComponent(programRegistryId)}/conditions`,
      fetchOptions,
    ),
  );
};
