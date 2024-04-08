import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const usePatientFieldDefinitionQuery = () => {
  const api = useApi();
  return useQuery(['patientFieldDefinition'], () => api.get(`patientFieldDefinition`));
};
