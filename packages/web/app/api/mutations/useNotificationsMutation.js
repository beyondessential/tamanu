import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { notifyError } from '../../utils';

export const useMarkAsRead = (id) => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body) => {
      api.put(`notifications/markAsRead/${id}`, body);
      queryClient.invalidateQueries(['notifications', {}]);
    },
    onError: (error) => notifyError(error.message),
  });
};

export const useMarkAllAsRead = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body) => {
      api.put('notifications/markAllAsRead', body);
      queryClient.invalidateQueries(['notifications', {}]);
    },
    onError: (error) => notifyError(error.message),
  });
};
