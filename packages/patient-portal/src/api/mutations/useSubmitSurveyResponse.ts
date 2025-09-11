import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { type CreateSurveyResponseRequest } from '@tamanu/shared/schemas/patientPortal/requests/createSurveyResponse.schema';

export const useSubmitSurveyResponse = (
  assignmentId: string,
  options?: UseMutationOptions<void, Error, CreateSurveyResponseRequest>,
) => {
  const queryClient = useQueryClient();
  const api = useApi();
  return useMutation<void, Error, CreateSurveyResponseRequest>({
    mutationKey: ['submitSurveyResponse', assignmentId],
    mutationFn: async payload => {
      await api.post(`surveyResponse/${assignmentId}`, payload as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outstandingSurveys'] });
    },
    ...options,
  });
};
