import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const usePatientProgramRegistrationQuery = (patientId, programRegistryId, fetchOptions) => {
  const api = useApi();
  return useQuery(['patient', patientId, 'programRegistration', programRegistryId], () =>
    api.get(
      `patient/${encodeURIComponent(patientId)}/programRegistration/${encodeURIComponent(
        programRegistryId,
      )}`,
      fetchOptions,
    ),
  );
};
