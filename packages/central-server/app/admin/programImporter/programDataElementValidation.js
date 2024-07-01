import config from 'config';
import { statkey, updateStat } from '../stats';
import {
  PROGRAM_DATA_ELEMENT_TYPES,
  VISIBILITY_STATUSES,
  SURVEY_TYPES,
  COMPLEX_CORE_DATA_ELEMENT_TYPES,
} from '@tamanu/constants';
import { validateVisualisationConfig } from './visualisationConfigValidation';

// Checks complex chart core question config individually
function validateComplexChartCoreQuestion(programDataElementRecord, surveyScreenComponentRecord) {
  const { type } = programDataElementRecord.values;
  const { visibilityStatus } = surveyScreenComponentRecord.values;

  if (COMPLEX_CORE_DATA_ELEMENT_TYPES.includes(type) === false) {
    throw new Error('Invalid question type');
  }

  const mandatoryTypes = [
    PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_INSTANCE_NAME,
    PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_DATE,
  ];
  const isMandatory = mandatoryTypes.includes(type);
  if (visibilityStatus !== VISIBILITY_STATUSES.CURRENT && isMandatory) {
    throw new Error(`${type} cannot be hidden`);
  }
}

// Checks that complex chart core questions: are exactly 4 and ordered specifically
function validateComplexChartCore(programDataElementRecords, sheetName, stats, errors) {
  const hasFourQuestions = programDataElementRecords.length === COMPLEX_CORE_DATA_ELEMENT_TYPES.length;
  const hasCorrectOrder = programDataElementRecords.every(
    (element, index) => element?.values?.type === COMPLEX_CORE_DATA_ELEMENT_TYPES[index],
  );

  if (!hasFourQuestions || !hasCorrectOrder) {
    const error = new Error('Invalid complex chart core questions');
    updateStat(stats, statkey('ProgramDataElement', sheetName), 'errored', 1);
    errors.push(error);
  }
}

function validateChartingFirstQuestion(programDataElementRecords, sheetName, stats, errors) {
  const { code, type } = programDataElementRecords[0].values;
  if (type !== PROGRAM_DATA_ELEMENT_TYPES.DATE_TIME) {
    const error = new Error(
      `sheetName: ${sheetName}, code: '${code}', First question should be DateTime type`,
    );
    updateStat(stats, statkey('ProgramDataElement', sheetName), 'errored', 1);
    errors.push(error);
  }
}

export function validateProgramDataElementRecords(
  records,
  { context, sheetName, stats: previousStats = {}, surveyType },
) {
  const { errors } = context;
  const stats = { ...previousStats };

  const programDataElementRecords = records.filter(({ model }) => model === 'ProgramDataElement');

  if ([SURVEY_TYPES.SIMPLE_CHART, SURVEY_TYPES.COMPLEX_CHART].includes(surveyType)) {
    validateChartingFirstQuestion(programDataElementRecords, sheetName, stats, errors);
  }

  if (surveyType === SURVEY_TYPES.COMPLEX_CHART_CORE) {
    validateComplexChartCore(programDataElementRecords, sheetName, stats, errors);
  }

  for (const programDataElementRecord of programDataElementRecords) {
    const newErrors = [];
    const { values } = programDataElementRecord;
    const { visualisationConfig = '', code: dataElementCode } = values;

    const surveyScreenComponentRecord =
      records.find(r => r.values.dataElementId === values.id) || {};
    const { validationCriteria = '' } = surveyScreenComponentRecord.values;

    try {
      if (config.validateQuestionConfigs.enabled) {
        validateVisualisationConfig(visualisationConfig, validationCriteria);
      }
      if (surveyType === SURVEY_TYPES.COMPLEX_CHART_CORE) {
        validateComplexChartCoreQuestion(programDataElementRecord, surveyScreenComponentRecord);
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
