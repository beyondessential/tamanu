import { useMutation } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { notifyError } from '../../utils';

export const useCreateTasks = () => {
  const api = useApi();

  return useMutation({
    mutationFn: async (body) => {
      const result = await api.post('tasks', body);
      return result;
    },
    onError: (error) => notifyError(error.message),
  });
};

export const useMarkTaskCompleted = () => {
  const api = useApi();

  return useMutation({
    mutationFn: (body) => api.post('tasks/completed', body),
    onError: (error) => notifyError(error.message),
  });
};

export const useMarkTaskNotCompleted = () => {
  const api = useApi();

  return useMutation({
    mutationFn: async (body) => {
      const result = await api.put('tasks/notCompleted', body);
      return result;
    },
    onError: (error) => notifyError(error.message),
  });
};

export const useDeleteTask = () => {
  const api = useApi();

  return useMutation({
    mutationFn: async (body) => {
      const result = await api.delete('tasks', body);
      return result;
    },
    onError: (error) => notifyError(error.message),
  });
};

export const useMarkTaskTodo = () => {
  const api = useApi();

  return useMutation({
    mutationFn: (body) => api.put('tasks/todo', body),
    onError: (error) => notifyError(error.message),
  });
};
