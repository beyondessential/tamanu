import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useLabTestTypes = () => {
  const api = useApi();
  return useQuery(['labTestType'], () => api.get('labTestType'));
};
