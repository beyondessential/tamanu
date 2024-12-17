import { useEncounter } from '../../contexts/Encounter';
import { combineQueries } from '../combineQueries';
import { usePatientData } from './usePatientData';
import { useChartSurveyQuery } from './useChartSurveyQuery';
import { useChartData } from '../../contexts/ChartData';
import { getVisualisationConfig } from '../../utils/getVisualisationConfig';

export const useChartsVisualisationConfigsQuery = () => {
  const encounterQuery = useEncounter();
  const { encounter } = encounterQuery;

  const patientQuery = usePatientData(encounter.patientId);
  const { selectedChartTypeId } = useChartData();
  const chartSurveyQuery = useChartSurveyQuery(selectedChartTypeId);

  const {
    data: [patientData, surveyData],
    ...restOfQuery
  } = combineQueries([patientQuery, chartSurveyQuery]);

  return getVisualisationConfig(patientData, surveyData, restOfQuery);
};

