import { useQuery } from '@tanstack/react-query';
import { useApi } from '../index';

export const useProgramRegistryPatientComplexChartInstancesQuery = ({ patientId, chartSurveyId, enabled = true }) => {
  const api = useApi();

  return useQuery(
    ['programRegistryPatientComplexChartInstances', patientId, chartSurveyId],
    () => api.get(`programRegistry/patient/${patientId}/charts/${chartSurveyId}/chartInstances`),
    {
      enabled: Boolean(patientId) && Boolean(chartSurveyId) && enabled,
    },
  );
};