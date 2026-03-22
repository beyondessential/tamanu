import { useQuery } from '@tanstack/react-query';
import { isErrorUnknownAllow404s, useApi } from '../index';

// Gets the first alphabetically ordered chart survey (for a specific program registry)
// that has any answer for this patient
export const useProgramRegistryPatientInitialChartQuery = (patientId, programRegistryId) => {
  const api = useApi();

  return useQuery(
    ['programRegistryPatientInitialChart', patientId, programRegistryId],
    () =>
      api.get(
        `programRegistry/patient/${patientId}/initialChart`,
        { programRegistryId },
        { isErrorUnknown: isErrorUnknownAllow404s },
      ),
    { enabled: Boolean(patientId) && Boolean(programRegistryId) },
  );
};
