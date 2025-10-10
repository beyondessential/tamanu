import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useApi } from '../useApi';

export const useLogout = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => {
      // completely clear the react-query cache
      queryClient.clear();
      // Redirect to login page
      navigate('/login');
    },
  });
};
