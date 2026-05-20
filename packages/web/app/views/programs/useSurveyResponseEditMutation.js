import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getAnswersFromData } from '@tamanu/ui-components';

import { useApi } from '../../api';
import { useAuth } from '../../contexts/Auth';

export const useSurveyResponseEditMutation = (
  { surveyResponseId, survey },
  useMutationOptions = {},
) => {
  const { onSuccess, ...rest } = useMutationOptions;

  const api = useApi();
  const { facilityId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async data =>
      await api.patch(`surveyResponse/${encodeURIComponent(surveyResponseId)}`, {
        facilityId,
        answers: await getAnswersFromData(data, survey),
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries(['surveyResponse', surveyResponseId]);
      queryClient.invalidateQueries(['surveyResponseChanges', surveyResponseId]);
      onSuccess?.(data, variables, context);
    },
    ...rest,
  });
};
