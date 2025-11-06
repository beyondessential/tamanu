import { useEncounter } from '../../contexts/Encounter';
import { getVisualisationConfig } from '../../utils/getVisualisationConfig';
import { combineQueries } from '../combineQueries';
import { usePatientDataQuery } from './usePatientDataQuery';
import { useVitalsSurveyQuery } from './useVitalsSurveyQuery';

export const useVitalsVisualisationConfigsQuery = () => {
  const encounterQuery = useEncounter();
  const { encounter } = encounterQuery;

  const patientQuery = usePatientDataQuery(encounter?.patientId);
  const vitalsSurveyQuery = useVitalsSurveyQuery();

  const {
    data: [patientData, surveyData],
    ...restOfQuery
  } = combineQueries([patientQuery, vitalsSurveyQuery]);

  return getVisualisationConfig(patientData, surveyData, restOfQuery);
};
