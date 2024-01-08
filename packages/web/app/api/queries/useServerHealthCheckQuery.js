import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useServerHealthCheckQuery = () => {
  const api = useApi();

  return useQuery(['serverHealthCheck'], () => api.healthCheck());
};
