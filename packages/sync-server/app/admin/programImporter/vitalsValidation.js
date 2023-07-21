import * as yup from 'yup';
import { parseOrNull } from '@tamanu/shared/utils/parse-or-null';
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

function validateVitalVisualisationConfig(visualisationConfigString, validationCriteriaString) {
  const visualisationConfig = parseOrNull(visualisationConfigString);
  const validationCriteria = parseOrNull(validationCriteriaString);

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

export function validateProgramDataElementRecords(records, { context, sheetName }) {
  const programDataElementRecords = records.filter(({ model }) => model === 'ProgramDataElement');

  for (const programDataElementRecord of programDataElementRecords) {
    const errors = [];
    const { values } = programDataElementRecord;
    const { visualisationConfig = '', code: dataElementCode } = values;

    const surveyScreenComponentRecord =
      records.find(r => r.values.dataElementId === values.id) || {};
    const { validationCriteria = '' } = surveyScreenComponentRecord.values;

    try {
      validateVitalVisualisationConfig(visualisationConfig, validationCriteria);
    } catch (e) {
      const error = new Error(
        `sheetName: ${sheetName}, data element code: '${dataElementCode}', ${e.message}`,
      );
      errors.push(error);

      if (errors.length > 0) {
        context.errors.push(...errors);
      }
    }
  }
}
