import { useMutation } from '@tanstack/react-query';
import { useHistory } from 'react-router-dom';
import { useApi } from '../useApi';
import { LoginCredentials, LoginResponse } from '../types';

export const useLogin = () => {
  const api = useApi();
  const history = useHistory();

  return useMutation<LoginResponse, Error, LoginCredentials>({
    mutationFn: (credentials: LoginCredentials) => api.tokenLogin(credentials),
    onSuccess: async () => {
      history.push('/');
    },
  });
};
