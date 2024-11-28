import { useQuery } from '@tanstack/react-query';

import { useApi } from '../useApi';

export const useEncounterChartInstancesQuery = ({ encounterId, chartSurveyId, enabled }) => {
  const api = useApi();

  return useQuery(
    ['encounterChartInstances', encounterId, chartSurveyId],
    () => api.get(`encounter/${encounterId}/charts/${chartSurveyId}/chartInstances`),
    { enabled },
  );
};
