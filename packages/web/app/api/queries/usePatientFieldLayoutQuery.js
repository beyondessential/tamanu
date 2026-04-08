import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const usePatientFieldLayoutQuery = () => {
  const api = useApi();
  return useQuery(['patientFieldLayout'], () => api.get('patientFieldLayout'));
};
