import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../../../api';
import { PATIENT_FIELD_LAYOUTS_ENDPOINT } from '../constants';

export const useReorderPatientFieldLayoutsMutation = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['patientFieldLayouts', 'reorder'],
    mutationFn: async ({ layouts }) =>
      api.put(`${PATIENT_FIELD_LAYOUTS_ENDPOINT}/reorder`, { layouts }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patientFieldLayouts'] });
    },
  });
};
