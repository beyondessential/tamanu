import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const usePatientInsurancePlansQuery = ({ patientId }) => {
  const api = useApi();
  return useQuery(['insurancePlans', patientId], () =>
    api.get(`patient/${patientId}/insurancePlans`),
  );
};
