import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { route } from '@tamanu/api-client';

export const usePatientInsurancePlansQuery = ({ patientId }) => {
  const api = useApi();
  return useQuery(
    ['insurancePlans', patientId],
    () => api.get(route('patient/:patientId/insurancePlans', { patientId })),
    { enabled: Boolean(patientId) },
  );
};
