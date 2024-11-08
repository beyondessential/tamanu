import { useMutation } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { notifyError } from '../../utils';

export const useMarkAsRead = (id) => {
  const api = useApi();

  return useMutation({
    mutationFn: body => api.put(`notifications/markAsRead/${id}`, body),
    onError: error => notifyError(error.message),
  });
};

export const useMarkAllAsRead = () => {
  const api = useApi();

  return useMutation({
    mutationFn: body => api.put('notifications/markAllAsRead', body),
    onError: error => notifyError(error.message),
  });
};
