import { z } from 'zod';

import {
  CHARTING_SURVEY_TYPES,
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

const programDefinitionQuestionSchema = z
  .object({
    code: z.string().trim().min(1),
    name: z.string().trim().optional(),
    text: z.string().trim().min(1),
    type: z.string().trim().min(1),
    options: z.union([z.string(), z.array(z.string()), z.record(z.string())]).optional(),
    newScreen: z.boolean().optional(),
    visibilityCriteria: z.union([z.string(), z.record(z.unknown())]).optional(),
    validationCriteria: z.union([z.string(), z.record(z.unknown())]).optional(),
    detail: z.string().optional(),
    config: z.union([z.string(), z.record(z.unknown())]).optional(),
    calculation: z.string().optional(),
    visibilityStatus: z.string().trim().optional(),
    visualisationConfig: z.union([z.string(), z.record(z.unknown())]).optional(),
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

export const programDefinitionSchema = z.object({
  title: z.string().trim().min(1),
  programCode: z.string().trim().optional(),
  programName: z.string().trim().optional(),
  surveys: z
    .array(
      z.object({
        code: z.string().trim().min(1),
        name: z.string().trim().min(1),
        surveyType: z.string().trim().optional(),
        isSensitive: z.boolean().optional(),
        notifiable: z.boolean().optional(),
        notifyEmailAddresses: z.array(z.string().trim()).optional(),
        visibilityCriteria: z.union([z.string(), z.record(z.unknown())]).optional(),
        visibilityStatus: z.string().trim().optional(),
        questions: z
          .array(programDefinitionQuestionSchema)
          .min(1),
      }),
    )
    .min(1),
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

const replaceQuestionReferences = (value, questionCodeMap) => {
  if (!value) return value;
  let stringValue = typeof value === 'string' ? value : JSON.stringify(value);
  for (const [oldCode, newCode] of [...questionCodeMap.entries()].sort(
    ([oldCodeA], [oldCodeB]) => oldCodeB.length - oldCodeA.length,
  )) {
    stringValue = stringValue.replaceAll(`pde-${oldCode}`, `pde-${newCode}`);
  }
  return stringValue;
};

const stringifyField = (value, questionCodeMap = new Map()) => {
  if (!value) return '';
  return replaceQuestionReferences(value, questionCodeMap);
};

const createSurveyImportRows = ({ programId, surveyDefinition, surveyCode }) => {
  const surveyId = `${programId}-${surveyCode}`;
  const originalSurveyCode = createCode(surveyDefinition.code);
  const questionCodeMap = new Map(
    surveyDefinition.questions.map((question, questionIndex) => {
      const originalQuestionCode = createCode(question.code);
      const questionCode = originalQuestionCode.startsWith(originalSurveyCode)
        ? `${surveyCode}${originalQuestionCode.slice(originalSurveyCode.length)}`
        : `${surveyCode}${String(questionIndex + 1).padStart(3, '0')}`;

      return [originalQuestionCode, questionCode];
    }),
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
        visibilityCriteria: stringifyField(surveyDefinition.visibilityCriteria, questionCodeMap),
        visibilityStatus: surveyDefinition.visibilityStatus || VISIBILITY_STATUSES.CURRENT,
        notifiable: surveyDefinition.notifiable || false,
        notifyEmailAddresses: surveyDefinition.notifyEmailAddresses || [],
      },
    },
  ];

  let screenIndex = -1;
  let componentIndex = 0;
  for (const [questionIndex, question] of surveyDefinition.questions.entries()) {
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
          visualisationConfig: stringifyField(question.visualisationConfig, questionCodeMap),
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
          visibilityCriteria: stringifyField(question.visibilityCriteria, questionCodeMap),
          validationCriteria: stringifyField(question.validationCriteria, questionCodeMap),
          detail: question.detail || '',
          config: stringifyField(question.config, questionCodeMap),
          calculation: stringifyField(question.calculation, questionCodeMap),
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
      const surveyCode = await getAvailableSurveyCode(
        models.Survey,
        createCode(surveyDefinition.code),
      );
      const { rows, surveyId, surveyInfo } = createSurveyImportRows({
        programId,
        surveyCode,
        surveyDefinition,
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
