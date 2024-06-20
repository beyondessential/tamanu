import * as yup from 'yup';
import config from 'config';
import { parseOrNull } from '@tamanu/shared/utils/parse-or-null';
import { isNumberOrFloat } from '../../utils/numbers';
import { statkey, updateStat } from '../stats';
import {
  PROGRAM_DATA_ELEMENT_TYPES,
  VISIBILITY_STATUSES,
  SURVEY_TYPES,
  COMPLEX_CORE_DATA_ELEMENT_TYPES,
} from '@tamanu/constants';

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

function validateComplexChartCoreConfig(programDataElementRecord, surveyScreenComponentRecord) {
  const { type } = programDataElementRecord.values;
  const { visibilityStatus } = surveyScreenComponentRecord.values;

  if (COMPLEX_CORE_DATA_ELEMENT_TYPES.includes(type) === false) {
    throw new Error('Invalid question type');
  }

  if (visibilityStatus !== VISIBILITY_STATUSES.CURRENT) {
    if (type === PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_INSTANCE_NAME) {
      throw new Error('ComplexChartInstanceName cannot be hidden');
    }
    if (type === PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_DATE) {
      throw new Error('ComplexChartDate cannot be hidden');
    }
  }
}

export function validateProgramDataElementRecords(
  records,
  { context, sheetName, stats: previousStats = {}, surveyType },
) {
  if (!config.validateQuestionConfigs.enabled) {
    return previousStats;
  }

  const { errors } = context;
  const stats = { ...previousStats };

  const programDataElementRecords = records.filter(({ model }) => model === 'ProgramDataElement');

  if ([SURVEY_TYPES.SIMPLE_CHART, SURVEY_TYPES.COMPLEX_CHART].includes(surveyType)) {
    const { code, type } = programDataElementRecords[0].values;
    if (type !== PROGRAM_DATA_ELEMENT_TYPES.DATE_TIME) {
      const error = new Error(
        `sheetName: ${sheetName}, code: '${code}', First question should be DateTime type`,
      );
      updateStat(stats, statkey('ProgramDataElement', sheetName), 'errored', 1);
      errors.push(error);
    }
  }

  if (surveyType === SURVEY_TYPES.COMPLEX_CHART_CORE) {
    const typesString = programDataElementRecords.map(pde => pde.values.type).join();
    if (typesString !== COMPLEX_CORE_DATA_ELEMENT_TYPES.join()) {
      const error = new Error('Invalid complex chart core questions');
      updateStat(stats, statkey('ProgramDataElement', sheetName), 'errored', 1);
      errors.push(error);
    }
  }

  for (const programDataElementRecord of programDataElementRecords) {
    const newErrors = [];
    const { values } = programDataElementRecord;
    const { visualisationConfig = '', code: dataElementCode } = values;

    const surveyScreenComponentRecord =
      records.find(r => r.values.dataElementId === values.id) || {};
    const { validationCriteria = '' } = surveyScreenComponentRecord.values;

    try {
      validateVitalVisualisationConfig(visualisationConfig, validationCriteria);
      if (surveyType === SURVEY_TYPES.COMPLEX_CHART_CORE) {
        validateComplexChartCoreConfig(programDataElementRecord, surveyScreenComponentRecord);
      }
    } catch (e) {
      const error = new Error(`sheetName: ${sheetName}, code: '${dataElementCode}', ${e.message}`);
      newErrors.push(error);
    }

    if (newErrors.length > 0) {
      updateStat(stats, statkey('ProgramDataElement', sheetName), 'errored', newErrors.length);
      errors.push(...newErrors);
    }
  }

  return stats;
}
