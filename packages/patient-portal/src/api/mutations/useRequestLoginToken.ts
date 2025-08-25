import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { useApi } from '../useApi';

interface RequestLoginTokenResponse {
  message: string;
}

export const useRequestLoginToken = (
  options?: UseMutationOptions<RequestLoginTokenResponse, Error, string>,
) => {
  const api = useApi();
  return useMutation({
    mutationFn: async (email: string): Promise<RequestLoginTokenResponse> => {
      return await api.post('request-login-token', { email } as any);
    },
    ...options,
  });
};
