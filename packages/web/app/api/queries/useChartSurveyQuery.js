import { useQuery } from '@tanstack/react-query';

import { isErrorUnknownAllow404s, useApi } from '../index';

export const useChartSurveyQuery = surveyId => {
  const api = useApi();
  const chartSurvey = useQuery(['chartSurvey'], () =>
    api.get(`survey/chart/${surveyId}`, {}, { isErrorUnknown: isErrorUnknownAllow404s }),
  );

  return chartSurvey;
};
