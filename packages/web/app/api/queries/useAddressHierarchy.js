import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useAddressHierarchy = (type, options) => {
  const api = useApi();

  return useQuery(['addressHierarchy', type], () => api.get(`addressHierarchy/${type}`, options));
};
