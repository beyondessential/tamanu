import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useLocationsQuery = () => {
  const api = useApi();

  return useQuery(['locations'], () => api.get('location'));
};
