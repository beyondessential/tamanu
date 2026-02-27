import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

interface PortalConfig {
  countryTimeZone: string;
}

export const useConfigQuery = () => {
  const api = useApi();

  return useQuery<PortalConfig>({
    queryKey: ['config'],
    queryFn: () => api.get('config'),
    staleTime: Infinity,
  });
};
