import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
export const usePublicConfig = () => {
  const api = useApi();

  return useQuery(['public', 'localisation'], () => api.get('public/localisation'));
};

export const useBrandName = () => {
  const { data } = usePublicConfig();
  return data?.brand.name;
};

export const useBrandId = () => {
  const { data } = usePublicConfig();
  return data?.brand.id;
};
