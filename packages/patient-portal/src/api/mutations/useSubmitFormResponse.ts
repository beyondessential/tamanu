import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { type PortalCreateSurveyResponseRequest } from '@tamanu/shared/schemas/patientPortal/requests/createSurveyResponse.schema';

export const useSubmitFormResponse = (
  designationId: string,
  options?: UseMutationOptions<void, Error, PortalCreateSurveyResponseRequest>,
) => {
  const queryClient = useQueryClient();
  const api = useApi();
  return useMutation<void, Error, PortalCreateSurveyResponseRequest>({
    mutationKey: ['submitFormResponse', designationId],
    mutationFn: async payload => {
      await api.post(`/me/forms/${designationId}`, payload as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outstandingForms'] });
    },
    ...options,
  });
};
