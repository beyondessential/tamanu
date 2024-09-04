import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useCreateTask = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async body => {
      const result = await api.post('encounter/tasks', body);
      await queryClient.invalidateQueries([`encounter/${body?.encounterId}/task`]);
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
      const result = await api.post('encounter/taskSet', body);
      await queryClient.invalidateQueries([`encounter/${body?.encounterId}/taskSet`]);
      return result;
    },
    onError: error => notifyError(error.message),
  });
};
