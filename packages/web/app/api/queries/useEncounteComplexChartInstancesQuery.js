import { useQuery } from '@tanstack/react-query';

import { useApi } from '../useApi';

export const useEncounterComplexChartInstancesQuery = ({ encounterId, chartSurveyId, enabled }) => {
  const api = useApi();

  return useQuery(
    ['encounterComplexChartInstances', encounterId, chartSurveyId],
    () => api.get(`encounter/${encounterId}/charts/${chartSurveyId}/chartInstances`),
    { enabled },
  );
};
