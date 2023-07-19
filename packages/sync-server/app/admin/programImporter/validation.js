import { Op } from 'sequelize';
import * as yup from 'yup';
import { VITALS_DATA_ELEMENT_IDS, SURVEY_TYPES } from '@tamanu/shared/constants';
import { parseOrNull } from '@tamanu/shared/utils/parse-or-null';
import { ImporterMetadataError, ValidationError } from '../errors';

const isNumberOrFloat = value => {
  if (typeof value !== 'number') {
    return false;
  }

  return !isNaN(value);
};

const normalRangeObjectSchema = yup
  .object()
  .shape({
    min: yup.number(),
    max: yup.number(),
    ageUnit: yup.string().oneOf(['years', 'months', 'weeks']),
    ageMin: yup.number(),
    ageMax: yup.number(),
  })
  .noUnknown()
  .test({
    name: 'normalRange',
    message: ctx => `normalRange should have either min or max, got ${JSON.stringify(ctx.value)}`,
    test: value => {
      return isNumberOrFloat(value.min) || isNumberOrFloat(value.max);
    },
  });

const visualisationConfigSchema = yup.object().shape({
  yAxis: yup.object().shape({
    graphRange: yup
      .object()
      .shape({
        min: yup.number().required(),
        max: yup.number().required(),
      })
      .required(),
    interval: yup.number().required(),
  }),
});

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
  normalRangeObjectSchema.validateSync(normalRange);

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

const REQUIRED_QUESTION_IDS = {
  [SURVEY_TYPES.VITALS]: Object.values(VITALS_DATA_ELEMENT_IDS),
};

export function ensureRequiredQuestionsPresent(surveyInfo, questionRecords) {
  const { surveyType, sheetName } = surveyInfo;

  const requiredQuestions = REQUIRED_QUESTION_IDS[surveyType];
  if (!requiredQuestions) {
    return;
  }

  // check that each mandatory question ID has a corresponding row in the import sheet
  const hasQuestion = id => questionRecords.some(q => q.values.id === id);
  const missingQuestions = requiredQuestions.filter(rf => !hasQuestion(rf));
  if (missingQuestions.length > 0) {
    throw new ValidationError(
      sheetName,
      -2,
      `Survey missing required questions: ${missingQuestions.join(', ')}`,
    );
  }
}

export function validateVisualisationConfigs(visualisationConfigString, validationCriteriaString) {
  const visualisationConfig = parseOrNull(visualisationConfigString);
  const validationCriteria = parseOrNull(validationCriteriaString);

  if (visualisationConfig) {
    if (!validationCriteria) {
      throw new Error('validationCriteria must be specified if visualisationConfig is presented');
    }
    if (!validationCriteria.normalRange) {
      throw new Error('validationCriteria must have normalRange');
    }

    visualisationConfigSchema.validateSync(visualisationConfig);
    validateNormalRange(validationCriteria.normalRange, visualisationConfig.yAxis.graphRange);
  }

  return true;
}

async function ensureOnlyOneVitalsSurveyExists({ models }, surveyInfo) {
  const vitalsCount = await models.Survey.count({
    where: {
      id: {
        [Op.not]: surveyInfo.id,
      },
      survey_type: SURVEY_TYPES.VITALS,
    },
  });
  if (vitalsCount > 0) {
    throw new ImporterMetadataError('Only one vitals survey may exist at a time');
  }
}

function ensureVitalsSurveyNonSensitive(surveyInfo) {
  if (surveyInfo.isSensitive) {
    throw new ImporterMetadataError('Vitals survey can not be sensitive');
  }
}

export async function validateVitalsSurvey(context, surveyInfo) {
  await ensureOnlyOneVitalsSurveyExists(context, surveyInfo);
  ensureVitalsSurveyNonSensitive(surveyInfo);
}
