import { useApi } from '../useApi';
import { useQuery } from '@tanstack/react-query';

export const usePatientOngoingPrescriptionsQuery = (patientId, facilityId) => {
  const api = useApi();
  return useQuery({
    queryKey: ['patient-ongoing-prescriptions', patientId, facilityId],
    queryFn: () => api.get(`/patient/${patientId}/ongoing-prescriptions`, { facilityId }),
    enabled: !!patientId,
  });
};
