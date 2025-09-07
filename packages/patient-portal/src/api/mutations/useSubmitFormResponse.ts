import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { type CreateSurveyResponseRequest } from '@tamanu/shared/schemas/patientPortal/requests/createSurveyResponse.schema';
  

export const useSubmitFormResponse = (
  designationId: string,
  options?: UseMutationOptions<any, Error, CreateSurveyResponseRequest>,
) => {
  const queryClient = useQueryClient();
  const api = useApi();
  return useMutation<any, Error, CreateSurveyResponseRequest>({
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
