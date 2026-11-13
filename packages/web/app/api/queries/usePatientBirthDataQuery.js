import { useQuery } from '@tanstack/react-query';
import { route } from '@tamanu/api-client';
import { useApi } from '../useApi';

export const usePatientBirthDataQuery = patientId => {
  const api = useApi();
  return useQuery(
    ['birthData', patientId],
    () => api.get(route('patient/:patientId/birthData', { patientId })),
    { enabled: Boolean(patientId) },
  );
};
