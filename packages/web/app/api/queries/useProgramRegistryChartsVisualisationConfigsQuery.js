import { combineQueries } from '../combineQueries';
import { usePatientDataQuery } from './usePatientDataQuery';
import { useSurveyQuery } from './useSurveyQuery';
import { getVisualisationConfig } from '../../utils/getVisualisationConfig';

export const useProgramRegistryChartsVisualisationConfigsQuery = (patientId, chartSurveyId) => {
  const patientQuery = usePatientDataQuery(patientId);
  const chartSurveyQuery = useSurveyQuery(chartSurveyId);

  const {
    data: [patientData, surveyData],
    ...restOfQuery
  } = combineQueries([patientQuery, chartSurveyQuery]);

  return getVisualisationConfig(patientData, surveyData, restOfQuery);
};
