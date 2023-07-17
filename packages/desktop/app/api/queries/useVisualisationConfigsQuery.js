import { BLOOD_PRESSURE, LINE, bloodPressureChartKeys } from '../../components/Charts/constants';
import { useEncounter } from '../../contexts/Encounter';
import { getConfigObject, getNormalRangeByAge } from '../../utils';
import { combineQueries } from '../combineQueries';
import { usePatientData } from './usePatientData';
import { useVitalsSurvey } from './useVitalsSurvey';

export const useVisualisationConfigsQuery = () => {
  const encounterQuery = useEncounter();
  const { encounter } = encounterQuery;

  const patientQuery = usePatientData(encounter.patientId);
  const vitalsSurveyQuery = useVitalsSurvey();

  const {
    data: [patientData, surveyData],
    ...restOfQuery
  } = combineQueries([patientQuery, vitalsSurveyQuery]);

  const { isSuccess } = restOfQuery;
  let visualisationConfigs = [];

  if (isSuccess) {
    visualisationConfigs = surveyData.components.map(
      ({ id, dataElement, config, validationCriteria: validationCriteriaString }) => {
        const hasVitalChart = !!dataElement.visualisationConfig;
        const isBloodPressureChart = bloodPressureChartKeys.includes(dataElement.id);
        const visualisationConfig = getConfigObject(id, dataElement.visualisationConfig);
        const validationCriteria = getConfigObject(id, validationCriteriaString);

        // TODO: Remove this once charts can read normal range from the validationCriteria
        if (hasVitalChart) {
          const { normalRange } = validationCriteria;
          visualisationConfig.yAxis.normalRange = normalRange;
          if (normalRange && Array.isArray(normalRange)) {
            const normalRangeByAge = getNormalRangeByAge(validationCriteria, patientData);
            visualisationConfig.yAxis.normalRange = normalRangeByAge;
          }
        }

        return {
          chartType: isBloodPressureChart ? BLOOD_PRESSURE : LINE,
          key: dataElement.id,
          name: bloodPressureChartKeys.includes(dataElement.id)
            ? 'Blood pressure (mm Hg)'
            : dataElement.name,
          hasVitalChart,
          config: getConfigObject(id, config),
          ...visualisationConfig,
        };
      },
    );
  }

  return { data: visualisationConfigs, ...restOfQuery };
};
