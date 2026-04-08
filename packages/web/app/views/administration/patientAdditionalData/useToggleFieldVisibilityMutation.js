import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../../../api';
import { PATIENT_FIELD_LAYOUTS_ENDPOINT } from '../constants';

export const useToggleFieldVisibilityMutation = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['patientFieldLayouts', 'visibility'],
    mutationFn: async ({ id, visibilityStatus }) =>
      api.put(`${PATIENT_FIELD_LAYOUTS_ENDPOINT}/${encodeURIComponent(id)}/visibility`, {
        visibilityStatus,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patientFieldLayouts'] });
    },
  });
};
