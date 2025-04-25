import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useUserQuery = (id, options) => {
  const api = useApi();
  return useQuery(['user', id], () => api.get(`user/${id}`, options), {
    enabled: !!id,
  });
};
