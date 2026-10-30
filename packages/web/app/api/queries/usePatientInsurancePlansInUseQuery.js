import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { route } from '@tamanu/api-client';

export const usePatientInsurancePlansInUseQuery = ({ patientId }) => {
  const api = useApi();
  return useQuery(
    ['insurancePlansInUse', patientId],
    () => api.get(route('patient/:patientId/insurancePlans/inUse', { patientId })),
    { enabled: Boolean(patientId) },
  );
};
