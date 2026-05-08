import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useSurveyResponseChangesQuery = (surveyResponseId, options = {}) => {
  const { enabled = true } = options;
  const api = useApi();
  return useQuery({
    ...options,
    queryKey: ['surveyResponseChanges', surveyResponseId],
    queryFn: async () =>
      await api.get(`surveyResponse/${encodeURIComponent(surveyResponseId)}/changes`),
    enabled: enabled && Boolean(surveyResponseId),
  });
};
