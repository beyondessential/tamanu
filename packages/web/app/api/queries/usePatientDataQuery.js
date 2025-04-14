import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { useAuth } from '../../contexts/Auth';

export const usePatientDataQuery = patientId => {
  const api = useApi();
  const { facilityId } = useAuth();

  return useQuery(
    ['patientDetails', patientId],
    () => api.get(`patient/${patientId}`, { facilityId }),
    {
      enabled: !!patientId,
    },
  );
};
