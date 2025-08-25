import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useApi } from '../useApi';

export const useLogin = () => {
  const api = useApi();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (email: string) => api.login(email),
    onSuccess: async () => {
      navigate('/');
    },
  });
};
