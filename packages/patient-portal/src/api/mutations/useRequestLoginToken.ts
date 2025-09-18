import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { RequestLoginTokenResponse } from '../types';

export const useRequestLoginToken = (
  options?: UseMutationOptions<RequestLoginTokenResponse, Error, string>,
) => {
  const api = useApi();
  return useMutation<RequestLoginTokenResponse, Error, string>({
    mutationFn: async (email: string): Promise<RequestLoginTokenResponse> => {
      await api.post('request-login-token', { email } as any);
      return { email };
    },
    ...options,
  });
};
