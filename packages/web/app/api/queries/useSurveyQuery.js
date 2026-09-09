import { useQuery } from '@tanstack/react-query';
import { useApi } from '../index';

export const useSurveyQuery = surveyId => {
  const api = useApi();
  return useQuery(
    ['survey', surveyId],
    () => api.get(`survey/${surveyId}`),
    { enabled: Boolean(surveyId) },
  );
};
