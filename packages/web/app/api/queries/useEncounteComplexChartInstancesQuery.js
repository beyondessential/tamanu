import { useQuery } from '@tanstack/react-query';

import { useApi } from '../useApi';
import { route } from '@tamanu/api-client';

export const useEncounterComplexChartInstancesQuery = ({ encounterId, chartSurveyId, enabled }) => {
  const api = useApi();

  return useQuery(
    ['encounterComplexChartInstances', encounterId, chartSurveyId],
    () =>
      api.get(
        route('encounter/:encounterId/charts/:chartSurveyId/chartInstances', {
          encounterId,
          chartSurveyId,
        }),
      ),
    { enabled },
  );
};
