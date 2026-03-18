import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const usePatientInsurancePlansInUseQuery = ({ patientId }) => {
  const api = useApi();
  return useQuery(
    ['insurancePlansInUse', patientId],
    () => api.get(`patient/${patientId}/insurancePlans/inUse`),
    { enabled: Boolean(patientId) },
  );
};
