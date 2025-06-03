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
      // Don't show error toast for this query because sometimes it is valid to not have a program registry for a patient
      { showUnknownErrorToast: false },
    ),
  );
};
