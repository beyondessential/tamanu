import { useMutation } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { notifyError } from '../../utils';

export const useCreateTasks = () => {
  const api = useApi();

  return useMutation({
    mutationFn: async body => {
      const result = await api.post('tasks', body);
      return result;
    },
    onError: error => notifyError(error.message),
  });
};
