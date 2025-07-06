import React from 'react';
import { SURVEY_TYPES, VITALS_DATA_ELEMENT_IDS } from '@tamanu/constants/surveys';
import { BLOOD_PRESSURE, bloodPressureChartKeys, LINE } from '../components/Charts/constants';
import { getConfigObject, getGraphRangeByAge, getNormalRangeByAge } from './survey';
import { TranslatedText } from '../components';

export const getVisualisationConfig = (patientData, surveyData, restOfQuery) => {
  const { isSuccess } = restOfQuery;
  let visualisationConfigs = [];

  // Complex charts should not have graphs enabled yet, this will be done later
  if (surveyData?.surveyType === SURVEY_TYPES.COMPLEX_CHART) {
    return { ...restOfQuery, data: { visualisationConfigs, allGraphedChartKeys: [] } };
  }

  if (isSuccess) {
    visualisationConfigs = surveyData.components.map(
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
          name: isBloodPressureChart ? (
            <TranslatedText
              stringId="vitals.bloodPressure.label"
              fallback="Blood pressure (mm Hg)"
              data-testid="translatedtext-blood-pressure-label"
            />
          ) : (
            dataElement.name
          ),
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
