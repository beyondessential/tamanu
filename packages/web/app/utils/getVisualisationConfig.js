import { SURVEY_TYPES, VITALS_DATA_ELEMENT_IDS } from '@tamanu/constants/surveys';
import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { getConfigObject, getGraphRangeByAge, getNormalRangeByAge } from '@tamanu/ui-components';
import { BLOOD_PRESSURE, bloodPressureChartKeys, LINE } from '../components/Charts/constants';

const hasHistoricalData = (chartDataArray, dataElementId) => {
  const answer = chartDataArray?.find(item => item.dataElementId === dataElementId);
  if (!answer?.records) {
    return false;
  }
  return Object.values(answer.records).some(record => record?.body);
}

export const getVisualisationConfig = (patientData, surveyData, restOfQuery, chartDataArray = []) => {
  const { isSuccess } = restOfQuery;
  let visualisationConfigs = [];

  // Complex charts should not have graphs enabled yet, this will be done later
  if (surveyData?.surveyType === SURVEY_TYPES.COMPLEX_CHART) {
    return { ...restOfQuery, data: { visualisationConfigs, allGraphedChartKeys: [] } };
  }

  if (isSuccess) {
    visualisationConfigs = surveyData.components
      // Filter out historical components without data
      .filter(({ dataElement, visibilityStatus }) => {
        if (visibilityStatus === VISIBILITY_STATUSES.CURRENT) {
          return true;
        }
        // For historical components, only include if they have recorded data
        return hasHistoricalData(chartDataArray, dataElement.id);
      })
      .map(
      ({ id, dataElement, config, validationCriteria: validationCriteriaString }) => {
        const hasVitalChart = !!dataElement.visualisationConfig;
        const isBloodPressureChart = bloodPressureChartKeys.includes(dataElement.id);
        const visualisationConfig = getConfigObject(id, dataElement.visualisationConfig);
        const validationCriteria = getConfigObject(id, validationCriteriaString);

        if (hasVitalChart) {
          // Extract graph range by age
          const graphRangeByAge = getGraphRangeByAge(visualisationConfig, patientData);
          visualisationConfig.yAxis.graphRange = graphRangeByAge;

          // TODO: Remove this once charts can read normal range from the validationCriteria
          // Copy normal range from validation criteria
          const { normalRange } = validationCriteria;
          visualisationConfig.yAxis.normalRange = normalRange;
          if (normalRange && Array.isArray(normalRange)) {
            const normalRangeByAge = getNormalRangeByAge(validationCriteria, patientData);
            visualisationConfig.yAxis.normalRange =
              normalRangeByAge || visualisationConfig.yAxis.graphRange;
          }
        }

        return {
          chartType: isBloodPressureChart ? BLOOD_PRESSURE : LINE,
          key: dataElement.id,
          name: isBloodPressureChart ? 'Blood pressure (mm Hg)' : dataElement.name,
          hasVitalChart,
          config: getConfigObject(id, config),
          ...visualisationConfig,
        };
      },
    );
  }

  const allGraphedChartKeys = visualisationConfigs
    .filter(({ hasVitalChart, key }) => hasVitalChart && key !== VITALS_DATA_ELEMENT_IDS.dbp) // Only show one blood pressure chart on multi vital charts
    .map(({ key }) => key);

  return { ...restOfQuery, data: { visualisationConfigs, allGraphedChartKeys } };
};
