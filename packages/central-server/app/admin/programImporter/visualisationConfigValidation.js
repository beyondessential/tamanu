import * as yup from 'yup';
import { safeJsonParse } from '@tamanu/utils/safeJsonParse';
import { isNumberOrFloat } from '../../utils/numbers';

const checkIfWithinGraphRange = (normalRange, graphRange) => {
  if (isNumberOrFloat(normalRange.min) && normalRange.min < graphRange.min) {
    return false;
  }
  if (isNumberOrFloat(normalRange.max) && normalRange.max > graphRange.max) {
    return false;
  }
  return true;
};

const validateNormalRangeAsObject = (normalRange, graphRange) => {
  if (!checkIfWithinGraphRange(normalRange, graphRange)) {
    throw new Error(
      `normalRange must be within graphRange, got normalRange: ${JSON.stringify(
        normalRange,
      )}, graphRange: ${JSON.stringify(graphRange)}}`,
    );
  }

  return true;
};

const validateNormalRangeAsArray = (normalRange, graphRange) => {
  for (const normalRangeObject of normalRange) {
    validateNormalRangeAsObject(normalRangeObject, graphRange);
  }

  return true;
};

const validateNormalRange = (normalRange, graphRange) => {
  if (yup.object().isType(normalRange)) {
    return validateNormalRangeAsObject(normalRange, graphRange);
  }

  if (yup.array().isType(normalRange)) {
    return validateNormalRangeAsArray(normalRange, graphRange);
  }

  return false;
};

export function validateVisualisationConfig(visualisationConfigString, validationCriteriaString) {
  const visualisationConfig = safeJsonParse(visualisationConfigString);
  const validationCriteria = safeJsonParse(validationCriteriaString);

  if (visualisationConfig) {
    if (!validationCriteria) {
      throw new Error('validationCriteria must be specified if visualisationConfig is presented');
    }
    if (!validationCriteria.normalRange) {
      throw new Error('validationCriteria must have normalRange');
    }

    validateNormalRange(validationCriteria.normalRange, visualisationConfig.yAxis.graphRange);
  }
}
