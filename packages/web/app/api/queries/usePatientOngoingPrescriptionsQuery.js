import { useApi } from '../useApi';
import { useQuery } from '@tanstack/react-query';

export const usePatientOngoingPrescriptionsQuery = patientId => {
  const api = useApi();
  return useQuery({
    queryKey: ['patient-ongoing-prescriptions', patientId],
    queryFn: () => api.get(`/patient/${patientId}/ongoingPrescriptions`),
    enabled: !!patientId,
  });
};
