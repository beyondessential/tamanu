import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { useAuth } from '../../contexts/Auth';
import { route } from '@tamanu/api-client';

export const usePatientDataQuery = patientId => {
  const api = useApi();
  const { facilityId } = useAuth();

  return useQuery(
    ['patientDetails', patientId],
    () => api.get(route('patient/:patientId', { patientId }), { facilityId }),
    {
      enabled: !!patientId,
    },
  );
};
