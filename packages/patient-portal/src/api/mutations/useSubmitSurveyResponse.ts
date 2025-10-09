import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import { useHistory } from 'react-router-dom';
import { notifyError, notifySuccess } from '@tamanu/ui-components';
import { useApi } from '../useApi';
import { type CreateSurveyResponseRequest } from '@tamanu/shared/schemas/patientPortal';

export const useSubmitSurveyResponse = (
  options?: UseMutationOptions<void, Error, CreateSurveyResponseRequest>,
) => {
  const queryClient = useQueryClient();
  const api = useApi();
  const history = useHistory();

  return useMutation<void, Error, CreateSurveyResponseRequest>({
    mutationFn: async payload => {
      await api.post('surveyResponse', payload as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outstandingSurveys'] });
      history.push('/');
      notifySuccess('Form submitted');
    },
    onError: error => {
      notifyError(error);
    },
    ...options,
  });
};
