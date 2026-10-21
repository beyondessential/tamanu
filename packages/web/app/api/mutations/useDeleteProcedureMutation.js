import { useMutation } from '@tanstack/react-query';
import { route } from '@tamanu/api-client';
import { useApi } from '../useApi';
import { notifyError } from '../../utils';

export const useDeleteProcedureMutation = (options = {}) => {
  const api = useApi();

  return useMutation({
    mutationFn: procedureId => api.delete(route('procedure/:procedureId', { procedureId })),
    onError: error => notifyError(error.message),
    ...options,
  });
};
