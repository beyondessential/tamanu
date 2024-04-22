import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const usePatientData = patientId => {
  const api = useApi();

  return useQuery(['patientDetails', patientId], () => api.get(`patient/${patientId}`));
};
