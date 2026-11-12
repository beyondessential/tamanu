import { useApi } from '../useApi';
import { useQuery } from '@tanstack/react-query';
import { route } from '@tamanu/api-client';

export const usePatientOngoingPrescriptionsQuery = (patientId, facilityId) => {
  const api = useApi();
  return useQuery({
    queryKey: ['patient-ongoing-prescriptions', patientId, facilityId],
    queryFn: () =>
      api.get(route('patient/:patientId/ongoing-prescriptions', { patientId }), { facilityId }),
    enabled: !!patientId,
  });
};
