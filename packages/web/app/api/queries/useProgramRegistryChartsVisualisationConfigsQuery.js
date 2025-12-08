import { useQuery } from '@tanstack/react-query';
import { combineQueries, isErrorUnknownAllow404s, useApi } from '../index';
import { usePatientDataQuery } from './usePatientDataQuery';
import { useSurveyQuery } from './useSurveyQuery';
import { getVisualisationConfig } from '../../utils/getVisualisationConfig';

export const useProgramRegistryChartsVisualisationConfigsQuery = (patientId, chartSurveyId) => {
  const api = useApi();
  const patientQuery = usePatientDataQuery(patientId);
  const chartSurveyQuery = useSurveyQuery(chartSurveyId);
  
  // Fetch chart data to determine which historical questions have data
  const chartDataQuery = useQuery(
    ['programRegistryPatientCharts', patientId, chartSurveyId],
    () =>
      api.get(
        `programRegistry/patient/${patientId}/charts/${chartSurveyId}`,
        { rowsPerPage: 1 },
        { isErrorUnknown: isErrorUnknownAllow404s },
      ),
    { enabled: Boolean(patientId) && Boolean(chartSurveyId) },
  );

  const {
    data: [patientData, surveyData, chartData],
    ...restOfQuery
  } = combineQueries([patientQuery, chartSurveyQuery, chartDataQuery]);

  return getVisualisationConfig(patientData, surveyData, restOfQuery, chartData?.data || []);
};
