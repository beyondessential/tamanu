import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { useApi } from '../useApi';

interface RequestLoginTokenResponse {
  message: string;
  token: string;
}

export const useRequestLoginToken = (
  options?: UseMutationOptions<RequestLoginTokenResponse, Error, string>,
) => {
  const api = useApi();
  return useMutation({
    mutationFn: (email: string) =>
      api.post('request-login-token', { email } as any, {
        returnResponse: true,
        useAuthToken: false,
        waitForAuth: false,
      }),
    ...options,
  });
};
