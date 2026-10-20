import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { useAuth } from '../../contexts/Auth';
import { route } from '@tamanu/api-client';

export const usePatientAdditionalDataQuery = (patientId, fetchOptions) => {
  const api = useApi();
  const { facilityId } = useAuth();
  return useQuery(
    ['additionalData', patientId],
    () => api.get(route('patient/:patientId/additionalData', { patientId }), { facilityId }),
    {
      enabled: !!patientId,
      ...fetchOptions,
    },
  );
};
