import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useApi } from '../useApi';
import { LoginCredentials, LoginResponse } from '../types';

export const useLogin = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation<LoginResponse, Error, LoginCredentials>({
    mutationFn: (credentials: LoginCredentials) => api.tokenLogin(credentials),
    onSuccess: async ({ user }) => {
      // The patient is known straight away, rather than through the failed check from before
      queryClient.setQueryData(['me'], user);
      navigate('/');
    },
  });
};
