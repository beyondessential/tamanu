import { useVitalsSurvey } from './useVitalsSurvey';

export const useVisualisationConfigs = () => {
  const vitalsSurveyQuery = useVitalsSurvey();

  const { data: surveyData, isLoading: isVitalsSurveyLoading } = vitalsSurveyQuery;
  let visualisationConfigs = [];
  if (!isVitalsSurveyLoading && surveyData && patient) {
    visualisationConfigs = surveyData.components.map(({ id, dataElement, config }) => {
      const hasVitalChart = !!dataElement.visualisationConfig;
      const isBloodPressureChart = bloodPressureChartKeys.includes(dataElement.id);

      const visualisationConfig = getConfigObject(id, dataElement.visualisationConfig);
      const { yAxis = {} } = visualisationConfig;
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
