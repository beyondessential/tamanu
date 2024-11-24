import { useQuery } from '@tanstack/react-query';

import { SURVEY_TYPES } from '@tamanu/constants';

import { useApi } from '../useApi';

export const useEncounterChartInstancesQuery = (encounterId, chartSurvey) => {
  const api = useApi();

  const { id: chartSurveyId, surveyType } = chartSurvey || {};
  return useQuery(
    [`encounter/${encounterId}/chartSurveys/${chartSurveyId}/chartInstances`],
    () => api.get(`encounter/${encounterId}/chartSurveys/${chartSurveyId}/chartInstances`),
    { enabled: surveyType === SURVEY_TYPES.COMPLEX_CHART_CORE },
  );
};
