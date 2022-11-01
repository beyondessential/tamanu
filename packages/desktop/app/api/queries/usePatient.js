import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const usePatient = patientId => {
  const api = useApi();
  return useQuery(['patient', patientId], () => api.get(`patient/${patientId}`));
};
