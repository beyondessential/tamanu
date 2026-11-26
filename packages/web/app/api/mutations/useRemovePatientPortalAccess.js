import { useMutation, useQueryClient } from '@tanstack/react-query';
import { route } from '@tamanu/api-client';
import { useApi } from '../useApi';

export const useRemovePatientPortalAccess = (patientId, options = {}) => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.delete(route('patient/:patientId/portal', { patientId })),
    ...options,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries(['patientDetails', patientId]);
      options.onSuccess?.(...args);
    },
  });
};
