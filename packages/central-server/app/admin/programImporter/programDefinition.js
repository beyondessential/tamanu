import { z } from 'zod';

import {
  CHARTING_SURVEY_TYPES,
  PATIENT_ISSUE_TYPES,
  PROGRAM_DATA_ELEMENT_TYPES,
  SURVEY_TYPES,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';

import { importRows } from '../importer/importRows';
import { idify } from './idify';
import { validateProgramDataElementRecords } from './programDataElementValidation';
import {
  ensureRequiredQuestionsPresent,
  validateChartingSurvey,
  validateVitalsSurvey,
} from './validation';

const DATA_ELEMENT_TYPES_REQUIRING_OPTIONS = [
  PROGRAM_DATA_ELEMENT_TYPES.SELECT,
  PROGRAM_DATA_ELEMENT_TYPES.RADIO,
  PROGRAM_DATA_ELEMENT_TYPES.MULTI_SELECT,
];
const DATA_ELEMENT_TYPES_WITH_NORMAL_RANGE = [
  PROGRAM_DATA_ELEMENT_TYPES.CALCULATED,
  PROGRAM_DATA_ELEMENT_TYPES.NUMBER,
  PROGRAM_DATA_ELEMENT_TYPES.RESULT,
];
const PATIENT_ISSUE_TYPE_VALUES = Object.values(PATIENT_ISSUE_TYPES);
const SUPPORTED_CONFIG_KEYS_BY_QUESTION_TYPE = {
  [PROGRAM_DATA_ELEMENT_TYPES.AUTOCOMPLETE]: ['scope', 'source', 'where'],
  [PROGRAM_DATA_ELEMENT_TYPES.CALCULATED]: ['rounding', 'unit'],
  [PROGRAM_DATA_ELEMENT_TYPES.NUMBER]: ['rounding', 'unit'],
  [PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA]: ['column', 'source', 'where', 'writeToPatient'],
  [PROGRAM_DATA_ELEMENT_TYPES.PATIENT_ISSUE]: ['issueNote', 'issueType'],
  [PROGRAM_DATA_ELEMENT_TYPES.RESULT]: ['rounding', 'unit'],
  [PROGRAM_DATA_ELEMENT_TYPES.SURVEY_ANSWER]: ['source'],
  [PROGRAM_DATA_ELEMENT_TYPES.SURVEY_LINK]: ['source'],
  [PROGRAM_DATA_ELEMENT_TYPES.SURVEY_RESULT]: ['source'],
  [PROGRAM_DATA_ELEMENT_TYPES.USER_DATA]: ['column'],
};
const SUPPORTED_WRITE_TO_PATIENT_KEYS = ['fieldName', 'fieldType'];

const normalizeOptions = options => {
  if (!options) return [];
  if (typeof options === 'string') {
    return options
      .split(',')
      .map(option => option.trim())
      .filter(Boolean);
  }
  if (Array.isArray(options)) return options;
  return Object.values(options);
};

const hasOptions = options => normalizeOptions(options).length > 0;

const parseObjectField = value => {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      const parsedValue = JSON.parse(value);
      return parsedValue && typeof parsedValue === 'object' && !Array.isArray(parsedValue)
        ? parsedValue
        : null;
    } catch {
      return null;
    }
  }

  return typeof value === 'object' && !Array.isArray(value) ? value : null;
};

const pickKnownKeys = (object, keys) =>
  Object.fromEntries(Object.entries(object).filter(([key]) => keys.includes(key)));

const normalizeCalculation = calculation =>
  typeof calculation === 'string' ? calculation.trim().replace(/^=\s*/, '') : calculation;

const sanitizeQuestionConfig = question => {
  const config = parseObjectField(question.config);
  if (!config) return question;

  const sanitizedQuestion = { ...question };
  const normalRange = config.normalRange;
  if (normalRange && DATA_ELEMENT_TYPES_WITH_NORMAL_RANGE.includes(question.type)) {
    const validationCriteria = parseObjectField(question.validationCriteria) || {};
    sanitizedQuestion.validationCriteria = validationCriteria.normalRange
      ? validationCriteria
      : {
          ...validationCriteria,
          normalRange,
        };
  }

  const supportedKeys = SUPPORTED_CONFIG_KEYS_BY_QUESTION_TYPE[question.type] || [];
  const sanitizedConfig = pickKnownKeys(config, supportedKeys);
  if (
    sanitizedConfig.writeToPatient &&
    typeof sanitizedConfig.writeToPatient === 'object' &&
    !Array.isArray(sanitizedConfig.writeToPatient)
  ) {
    sanitizedConfig.writeToPatient = pickKnownKeys(
      sanitizedConfig.writeToPatient,
      SUPPORTED_WRITE_TO_PATIENT_KEYS,
    );
  }

  if (Object.keys(sanitizedConfig).length === 0) {
    delete sanitizedQuestion.config;
    return sanitizedQuestion;
  }

  return {
    ...sanitizedQuestion,
    config: sanitizedConfig,
  };
};

const sanitizeSurveyMetadata = survey => {
  if (survey.status !== 'draft') return survey;

  const sanitizedSurvey = { ...survey };
  delete sanitizedSurvey.status;
  return sanitizedSurvey;
};

const sanitizeQuestion = question => {
  const sanitizedQuestion = sanitizeQuestionConfig(question);
  const calculation = normalizeCalculation(sanitizedQuestion.calculation);
  return calculation == null
    ? sanitizedQuestion
    : {
        ...sanitizedQuestion,
        calculation,
      };
};

export const sanitizeProgramDefinitionPreview = programDefinition => ({
  ...programDefinition,
  surveys: programDefinition.surveys.map(sanitizeSurveyMetadata),
  surveySheets: programDefinition.surveySheets.map(surveySheet => ({
    ...surveySheet,
    questions: surveySheet.questions.map(sanitizeQuestion),
  })),
});

const programDefinitionQuestionSchema = z
  .object({
    code: z.string().trim().min(1),
    name: z.string().trim().optional(),
    text: z.string().trim().min(1),
    type: z.string().trim().min(1),
    options: z.union([z.string(), z.array(z.string()), z.record(z.string(), z.string())]).optional(),
    newScreen: z.boolean().optional(),
    visibilityCriteria: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
    validationCriteria: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
    detail: z.string().optional(),
    config: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
    calculation: z.string().optional(),
    visibilityStatus: z.string().trim().optional(),
    visualisationConfig: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
  })
  .superRefine((question, ctx) => {
    if (
      DATA_ELEMENT_TYPES_REQUIRING_OPTIONS.includes(question.type) &&
      !hasOptions(question.options)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: `${question.type} questions must include options`,
      });
    }
  });

const surveyMetadataSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  surveyType: z.string().trim().optional(),
  status: z.string().trim().optional(),
  isSensitive: z.boolean().optional(),
  notifiable: z.boolean().optional(),
  notifyEmailAddresses: z.array(z.string().trim()).optional(),
  visibilityCriteria: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
  visibilityStatus: z.string().trim().optional(),
});

const surveySheetSchema = z.object({
  surveyName: z.string().trim().min(1),
  questions: z.array(programDefinitionQuestionSchema).min(1),
});

export const programDefinitionSchema = z
  .object({
    title: z.string().trim().min(1),
    programCode: z.string().trim().optional(),
    programName: z.string().trim().optional(),
    surveys: z.array(surveyMetadataSchema).min(1),
    surveySheets: z.array(surveySheetSchema).min(1),
  })
  .superRefine((programDefinition, ctx) => {
    const sheetNames = new Set(programDefinition.surveySheets.map(({ surveyName }) => surveyName));
    for (const [index, survey] of programDefinition.surveys.entries()) {
      if (!sheetNames.has(survey.name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['surveys', index, 'name'],
          message: `Survey "${survey.name}" must have a matching surveySheet`,
        });
      }
    }
  });

const createCode = value => idify(value) || 'generatedform';

const getAvailableSurveyCode = async (Survey, baseCode) => {
  let code = baseCode;
  let suffix = 1;

  while (await Survey.findOne({ where: { code }, attributes: ['id'] })) {
    suffix += 1;
    code = `${baseCode}${suffix}`;
  }

  return code;
};

const replaceQuestionReferences = (value, sortedQuestionCodeEntries) => {
  if (!value) return value;
  let stringValue = typeof value === 'string' ? value : JSON.stringify(value);
  for (const [oldCode, newCode] of sortedQuestionCodeEntries) {
    stringValue = stringValue.replaceAll(`pde-${oldCode}`, `pde-${newCode}`);
  }
  return stringValue;
};

const stringifyField = (value, sortedQuestionCodeEntries = []) => {
  if (!value) return '';
  return replaceQuestionReferences(value, sortedQuestionCodeEntries);
};

const parseConfig = config => {
  if (!config || typeof config !== 'string') return config;
  try {
    return JSON.parse(config);
  } catch {
    return config;
  }
};

const normalizePatientIssueType = issueType => {
  if (PATIENT_ISSUE_TYPE_VALUES.includes(issueType)) return issueType;

  return /urgent|warning|alert|risk|danger|emergency/i.test(issueType || '')
    ? PATIENT_ISSUE_TYPES.WARNING
    : PATIENT_ISSUE_TYPES.ISSUE;
};

export const normalizeQuestionConfigForImport = question => {
  if (question.type !== PROGRAM_DATA_ELEMENT_TYPES.PATIENT_ISSUE) return question.config;

  const config = parseConfig(question.config);
  if (!config || typeof config !== 'object' || Array.isArray(config)) return question.config;

  return {
    ...config,
    issueType: normalizePatientIssueType(config.issueType),
  };
};

const createSurveyImportRows = ({ programId, surveyDefinition, surveySheet, surveyCode }) => {
  const surveyId = `${programId}-${surveyCode}`;
  const originalSurveyCode = createCode(surveyDefinition.code);
  const questionCodeMap = new Map(
    surveySheet.questions.map((question, questionIndex) => {
      const originalQuestionCode = createCode(question.code);
      const questionCode = originalQuestionCode.startsWith(originalSurveyCode)
        ? `${surveyCode}${originalQuestionCode.slice(originalSurveyCode.length)}`
        : `${surveyCode}${String(questionIndex + 1).padStart(3, '0')}`;

      return [originalQuestionCode, questionCode];
    }),
  );
  const sortedQuestionCodeEntries = [...questionCodeMap.entries()].sort(
    ([oldCodeA], [oldCodeB]) => oldCodeB.length - oldCodeA.length,
  );

  const rows = [
    {
      model: 'Survey',
      sheetRow: -2,
      values: {
        id: surveyId,
        code: surveyCode,
        name: surveyDefinition.name,
        sheetName: surveyDefinition.name,
        rowIndex: -2,
        surveyType: surveyDefinition.surveyType || SURVEY_TYPES.PROGRAMS,
        isSensitive: surveyDefinition.isSensitive || false,
        programId,
        visibilityCriteria: stringifyField(surveyDefinition.visibilityCriteria, sortedQuestionCodeEntries),
        visibilityStatus: surveyDefinition.visibilityStatus || VISIBILITY_STATUSES.CURRENT,
        notifiable: surveyDefinition.notifiable || false,
        notifyEmailAddresses: surveyDefinition.notifyEmailAddresses || [],
      },
    },
  ];

  let screenIndex = -1;
  let componentIndex = 0;
  for (const [questionIndex, question] of surveySheet.questions.entries()) {
    if (questionIndex === 0 || question.newScreen) {
      screenIndex += 1;
      componentIndex = 0;
    }

    const questionCode = questionCodeMap.get(createCode(question.code));
    const dataElementId = `pde-${questionCode}`;
    const type = question.type || PROGRAM_DATA_ELEMENT_TYPES.TEXT;
    const defaultOptions = DATA_ELEMENT_TYPES_REQUIRING_OPTIONS.includes(type)
      ? JSON.stringify(normalizeOptions(question.options))
      : '';
    const questionConfig = normalizeQuestionConfigForImport({ ...question, type });

    rows.push(
      {
        model: 'ProgramDataElement',
        sheetRow: questionIndex,
        values: {
          id: dataElementId,
          code: questionCode,
          name: question.name || questionCode,
          type,
          defaultText: question.text,
          defaultOptions,
          visualisationConfig: stringifyField(question.visualisationConfig, sortedQuestionCodeEntries),
        },
      },
      {
        model: 'SurveyScreenComponent',
        sheetRow: questionIndex,
        values: {
          id: `${surveyId}-${questionCode}`,
          surveyId,
          dataElementId,
          screenIndex,
          componentIndex,
          text: '',
          options: '',
          visibilityCriteria: stringifyField(question.visibilityCriteria, sortedQuestionCodeEntries),
          validationCriteria: stringifyField(question.validationCriteria, sortedQuestionCodeEntries),
          detail: question.detail || '',
          config: stringifyField(questionConfig, sortedQuestionCodeEntries),
          calculation: stringifyField(question.calculation, sortedQuestionCodeEntries),
          visibilityStatus: question.visibilityStatus || VISIBILITY_STATUSES.CURRENT,
          type,
        },
      },
    );
    componentIndex += 1;
  }

  return { rows, surveyId, surveyInfo: rows[0].values };
};

const validateSurvey = async ({ context, rows, surveyInfo }) => {
  if (surveyInfo.surveyType === SURVEY_TYPES.VITALS) {
    await validateVitalsSurvey(context, surveyInfo);
  }
  if (CHARTING_SURVEY_TYPES.includes(surveyInfo.surveyType)) {
    await validateChartingSurvey(context, surveyInfo);
  }

  ensureRequiredQuestionsPresent(surveyInfo, rows);
  return validateProgramDataElementRecords(rows, {
    context,
    sheetName: surveyInfo.name,
    surveyType: surveyInfo.surveyType,
  });
};

export const saveProgramDefinition = async ({ db, models, programId, programDefinition }) => {
  const errors = [];
  const context = {
    errors,
    log: log.child({
      importer: 'programDefinition',
    }),
    models,
  };
  const customPatientFieldIds = (
    await models.PatientFieldDefinition.findAll({
      attributes: ['id'],
    })
  ).map(field => field.id);
  const surveyIds = [];

  await db.transaction(async () => {
    for (const surveyDefinition of programDefinition.surveys) {
      const surveySheet = programDefinition.surveySheets.find(
        ({ surveyName }) => surveyName === surveyDefinition.name,
      );
      const surveyCode = await getAvailableSurveyCode(
        models.Survey,
        createCode(surveyDefinition.code),
      );
      const { rows, surveyId, surveyInfo } = createSurveyImportRows({
        programId,
        surveyCode,
        surveyDefinition,
        surveySheet,
      });
      const stats = await validateSurvey({ context, rows, surveyInfo });
      if (errors.length > 0) throw errors[0];

      await importRows(
        context,
        {
          rows,
          sheetName: surveyInfo.name,
          stats,
        },
        {
          models,
          programId,
          customPatientFieldIds,
        },
      );
      if (errors.length > 0) throw errors[0];

      surveyIds.push(surveyId);
    }
  });

  return models.Survey.findAll({
    where: { id: surveyIds },
  });
};
