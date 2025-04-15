import { useQuery } from '@tanstack/react-query';

import { isErrorUnknownAllow404s, useApi } from '../index';

export const useChartSurveyQuery = (surveyId) => {
  const api = useApi();
  const chartSurvey = useQuery(
    ['chartSurvey', surveyId],
    () => api.get(`survey/${surveyId}`, {}, { isErrorUnknown: isErrorUnknownAllow404s }),
    { enabled: Boolean(surveyId) },
  );

  return chartSurvey;
};
