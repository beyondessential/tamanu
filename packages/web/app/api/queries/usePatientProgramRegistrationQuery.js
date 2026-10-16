import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { route } from '@tamanu/api-client';

export const usePatientProgramRegistrationQuery = (patientId, programRegistryId, fetchOptions) => {
  const api = useApi();
  return useQuery(['patient', patientId, 'programRegistration', programRegistryId], () =>
    api.get(
      route('patient/:patientId/programRegistration/:programRegistryId', {
        patientId,
        programRegistryId,
      }),
      fetchOptions,
      // Don't show error toast for this query because sometimes it is valid to not have a program registry for a patient
      { showUnknownErrorToast: false },
    ),
  );
};
