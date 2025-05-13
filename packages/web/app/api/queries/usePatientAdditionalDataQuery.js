import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { useAuth } from '../../contexts/Auth';

export const usePatientAdditionalDataQuery = (patientId) => {
  const api = useApi();
  const { facilityId } = useAuth();
  return useQuery(
    ['additionalData', patientId],
    () => api.get(`patient/${encodeURIComponent(patientId)}/additionalData`, { facilityId }),
    {
      enabled: !!patientId,
    },
  );
};
