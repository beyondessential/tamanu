import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useLogout = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => {
      // completely clear the react-query cache
      queryClient.clear();
    },
  });
};
