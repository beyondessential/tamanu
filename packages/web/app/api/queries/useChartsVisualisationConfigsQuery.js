import { useQuery } from '@tanstack/react-query';
import { useEncounter } from '../../contexts/Encounter';
import { combineQueries, useApi } from '../index';
import { usePatientDataQuery } from './usePatientDataQuery';
import { useSurveyQuery } from './useSurveyQuery';
import { useChartData } from '../../contexts/ChartData';
import { getVisualisationConfig } from '../../utils/getVisualisationConfig';
import { route } from '@tamanu/api-client';

export const useChartsVisualisationConfigsQuery = () => {
  const encounterQuery = useEncounter();
  const { encounter } = encounterQuery;
  const api = useApi();

  const patientQuery = usePatientDataQuery(encounter?.patientId);
  const { selectedChartTypeId } = useChartData();
  const chartSurveyQuery = useSurveyQuery(selectedChartTypeId);

  // Fetch chart data to determine which historical questions have data
  const chartDataQuery = useQuery(
    ['encounterCharts', encounter?.id, selectedChartTypeId],
    () =>
      api.get(
        route('encounter/:encounterId/charts/:selectedChartTypeId', {
          encounterId: encounter?.id,
          selectedChartTypeId,
        }),
        { rowsPerPage: 1 },
      ),
    { enabled: Boolean(encounter?.id) && Boolean(selectedChartTypeId) },
  );

  const {
    data: [patientData, surveyData, chartData],
    ...restOfQuery
  } = combineQueries([patientQuery, chartSurveyQuery, chartDataQuery]);

  return getVisualisationConfig(patientData, surveyData, restOfQuery, chartData?.data || []);
};
