import { useEncounter } from '../../contexts/Encounter';
import { combineQueries } from '../combineQueries';
import { usePatientDataQuery } from './usePatientDataQuery';
import { useSurveyQuery } from './useSurveyQuery';
import { useChartData } from '../../contexts/ChartData';
import { getVisualisationConfig } from '../../utils/getVisualisationConfig';

export const useChartsVisualisationConfigsQuery = () => {
  const encounterQuery = useEncounter();
  const { encounter } = encounterQuery;

  const patientQuery = usePatientDataQuery(encounter?.patientId);
  const { selectedChartTypeId } = useChartData();
  const chartSurveyQuery = useSurveyQuery(selectedChartTypeId);

  const {
    data: [patientData, surveyData],
    ...restOfQuery
  } = combineQueries([patientQuery, chartSurveyQuery]);

  return getVisualisationConfig(patientData, surveyData, restOfQuery);
};
