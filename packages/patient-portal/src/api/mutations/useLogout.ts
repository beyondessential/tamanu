import { useMutation } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useLogout = () => {
  const api = useApi();
  return useMutation({
    mutationFn: () => api.logout(),
  });
};
