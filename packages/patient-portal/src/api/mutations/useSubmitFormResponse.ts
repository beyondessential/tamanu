import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { type PortalCreateSurveyResponseRequest } from '@tamanu/shared/schemas/patientPortal/requests/createSurveyResponse.schema';
  

export const useSubmitFormResponse = (
  designationId: string,
  options?: UseMutationOptions<any, Error, PortalCreateSurveyResponseRequest>,
) => {
  const queryClient = useQueryClient();
  const api = useApi();
  return useMutation<any, Error, PortalCreateSurveyResponseRequest>({
    mutationKey: ['submitFormResponse', designationId],
    mutationFn: async (payload) => {
      return api.post(`/me/forms/${designationId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outstandingForms'] });
    },
    ...options,
  });
};
