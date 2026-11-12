import { useQuery } from '@tanstack/react-query';
import { useApi } from '../index';
import { route } from '@tamanu/api-client';

// Gets the first alphabetically ordered chart survey (for a specific program registry)
// that has any answer for this patient
export const useProgramRegistryPatientInitialChartQuery = (patientId, programRegistryId) => {
  const api = useApi();

  return useQuery(
    ['programRegistryPatientInitialChart', patientId, programRegistryId],
    () =>
      api.get(route('programRegistry/patient/:patientId/initialChart', { patientId }), {
        programRegistryId,
      }),
    { enabled: Boolean(patientId) && Boolean(programRegistryId) },
  );
};
