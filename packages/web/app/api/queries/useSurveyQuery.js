import { useQuery } from '@tanstack/react-query';
import { useApi } from '../index';
import { route } from '@tamanu/api-client';

export const useSurveyQuery = surveyId => {
  const api = useApi();
  return useQuery(['survey', surveyId], () => api.get(route('survey/:surveyId', { surveyId })), {
    enabled: Boolean(surveyId),
  });
};
