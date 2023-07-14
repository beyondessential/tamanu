import { BLOOD_PRESSURE, LINE, bloodPressureChartKeys } from '../../components/Charts/constants';
import { useEncounter } from '../../contexts/Encounter';
import { getConfigObject, getNormalRangeByAge } from '../../utils';
import { usePatientData } from './usePatientData';
import { useVitalsSurvey } from './useVitalsSurvey';

export const useVisualisationConfigs = () => {
  const encounterQuery = useEncounter();
  const { encounter } = encounterQuery;
  const patientQuery = usePatientData(encounter.patientId);
  const vitalsSurveyQuery = useVitalsSurvey();

  const { data: surveyData, isLoading: isVitalsSurveyLoading } = vitalsSurveyQuery;
  const { data: patient } = patientQuery;

  let visualisationConfigs = [];
  if (!isVitalsSurveyLoading && surveyData && patient) {
    visualisationConfigs = surveyData.components.map(({ id, dataElement, config }) => {
      const hasVitalChart = !!dataElement.visualisationConfig;
      const isBloodPressureChart = bloodPressureChartKeys.includes(dataElement.id);

      const visualisationConfig = getConfigObject(id, dataElement.visualisationConfig);
      const { yAxis = {} } = visualisationConfig;
      const { normalRange } = yAxis;
      if (normalRange && Array.isArray(normalRange)) {
        const normalRangeByAge = getNormalRangeByAge(yAxis, patient);
        visualisationConfig.yAxis.normalRange = normalRangeByAge;
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
    });
  }

  return visualisationConfigs;
};
