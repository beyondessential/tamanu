import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const usePatientLabTestResults = patientId => {
  const api = useApi();

  return useQuery(['patient', patientId], () => api.get(`patient/${patientId}/labTestResults`));
};
