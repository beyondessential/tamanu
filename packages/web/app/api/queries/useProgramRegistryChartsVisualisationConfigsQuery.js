import { useQuery } from '@tanstack/react-query';
import { combineQueries, useApi } from '../index';
import { usePatientDataQuery } from './usePatientDataQuery';
import { useSurveyQuery } from './useSurveyQuery';
import { getVisualisationConfig } from '../../utils/getVisualisationConfig';
import { route } from '@tamanu/api-client';

export const useProgramRegistryChartsVisualisationConfigsQuery = (patientId, chartSurveyId) => {
  const api = useApi();
  const patientQuery = usePatientDataQuery(patientId);
  const chartSurveyQuery = useSurveyQuery(chartSurveyId);

  // Fetch chart data to determine which historical questions have data
  const chartDataQuery = useQuery(
    ['programRegistryPatientCharts', patientId, chartSurveyId],
    () =>
      api.get(
        route('programRegistry/patient/:patientId/charts/:chartSurveyId', {
          patientId,
          chartSurveyId,
        }),
        { rowsPerPage: 1 },
      ),
    { enabled: Boolean(patientId) && Boolean(chartSurveyId) },
  );

  const {
    data: [patientData, surveyData, chartData],
    ...restOfQuery
  } = combineQueries([patientQuery, chartSurveyQuery, chartDataQuery]);

  return getVisualisationConfig(patientData, surveyData, restOfQuery, chartData?.data || []);
};
