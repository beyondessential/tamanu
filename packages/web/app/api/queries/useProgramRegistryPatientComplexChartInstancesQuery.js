import { useQuery } from '@tanstack/react-query';
import { useApi } from '../index';
import { route } from '@tamanu/api-client';

export const useProgramRegistryPatientComplexChartInstancesQuery = ({
  patientId,
  chartSurveyId,
  enabled = true,
}) => {
  const api = useApi();

  return useQuery(
    ['programRegistryPatientComplexChartInstances', patientId, chartSurveyId],
    () =>
      api.get(
        route('programRegistry/patient/:patientId/charts/:chartSurveyId/chartInstances', {
          patientId,
          chartSurveyId,
        }),
      ),
    {
      enabled: Boolean(patientId) && Boolean(chartSurveyId) && enabled,
    },
  );
};
