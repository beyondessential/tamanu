import { useMutation } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useLogin = () => {
  const api = useApi();
  return useMutation({
    mutationFn: (email: string) => api.login(email),
  });
};
