import { parseOrNull } from '@tamanu/shared/utils/parse-or-null';

export const addNormalRangeToVisualisationConfigFromValidationCriteria = (
  visualisationConfigString,
  validationCriteriaString,
) => {
  if (!visualisationConfigString && !validationCriteriaString) {
    return null;
  }

  const visualisationConfig = parseOrNull(visualisationConfigString) || {};
  const validationCriteria = parseOrNull(validationCriteriaString) || {};
  const newVisualisationConfig = { ...visualisationConfig };

  if (validationCriteria.normalRange) {
    newVisualisationConfig.yAxis = newVisualisationConfig.yAxis || {};
    newVisualisationConfig.yAxis.normalRange = validationCriteria.normalRange;
  }

  return Object.keys(newVisualisationConfig).length === 0 ? null : newVisualisationConfig;
};
