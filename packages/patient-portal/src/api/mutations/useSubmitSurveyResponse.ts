import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { notifyError, notifySuccess } from '@tamanu/ui-components';
import { useApi } from '../useApi';
import { type CreateSurveyResponseRequest } from '@tamanu/shared/schemas/patientPortal';

export const useSubmitSurveyResponse = (
  options?: UseMutationOptions<void, Error, CreateSurveyResponseRequest>,
) => {
  const queryClient = useQueryClient();
  const api = useApi();
  const navigate = useNavigate();

  return useMutation<void, Error, CreateSurveyResponseRequest>({
    mutationFn: async payload => {
      await api.post('surveyResponse', payload as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outstandingSurveys'] });
      navigate('/');
      notifySuccess('Form submitted');
    },
    onError: error => {
      notifyError(error);
    },
    ...options,
  });
};
