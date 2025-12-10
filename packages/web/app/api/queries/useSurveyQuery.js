import { useQuery } from '@tanstack/react-query';
import { isErrorUnknownAllow404s, useApi } from '../index';

export const useSurveyQuery = surveyId => {
  const api = useApi();
  return useQuery(
    ['survey', surveyId],
    () => api.get(`survey/${surveyId}`, {}, { isErrorUnknown: isErrorUnknownAllow404s }),
    { enabled: Boolean(surveyId) },
  );
};
