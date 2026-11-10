import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { route } from '@tamanu/api-client';

export const usePatientAllergiesQuery = patientId => {
  const api = useApi();
  return useQuery({
    queryKey: ['allergies', patientId],
    queryFn: () => api.get(route('patient/:patientId/allergies', { patientId })),
    enabled: !!patientId,
  });
};
