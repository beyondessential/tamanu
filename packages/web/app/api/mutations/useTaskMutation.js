import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { notifyError } from '../../utils';

export const useCreateTask = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async body => {
      const result = await api.post('tasks', body);
      await queryClient.invalidateQueries([`${body?.encounterId}/tasks`]);
      return result;
    },
    onError: error => notifyError(error.message),
  });
};

export const useCreateTaskSet = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async body => {
      const result = await api.post('tasks/taskSet', body);
      await queryClient.invalidateQueries([`${body?.encounterId}/tasks`]);
      return result;
    },
    onError: error => notifyError(error.message),
  });
};
