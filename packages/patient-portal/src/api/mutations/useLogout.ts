import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useHistory } from 'react-router-dom';
import { useApi } from '../useApi';

export const useLogout = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  const history = useHistory();

  return useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => {
      // completely clear the react-query cache
      queryClient.clear();
      // Redirect to login page
      history.push('/login');
    },
  });
};
