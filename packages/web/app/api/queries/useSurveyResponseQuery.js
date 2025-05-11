import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useSurveyResponseQuery = (surveyResponseId) => {
  const api = useApi();
  return useQuery(
    ['surveyResponse', surveyResponseId],
    () => api.get(`surveyResponse/${surveyResponseId}`),
    { enabled: !!surveyResponseId },
  );
};
