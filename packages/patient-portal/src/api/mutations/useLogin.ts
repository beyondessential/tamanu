import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useApi } from '../useApi';
import { LoginCredentials, LoginResponse } from '../types';

export const useLogin = () => {
  const api = useApi();
  const navigate = useNavigate();

  return useMutation<LoginResponse, Error, LoginCredentials>({
    mutationFn: (credentials: LoginCredentials) => api.tokenLogin(credentials),
    onSuccess: async () => {
      navigate('/');
    },
  });
};
