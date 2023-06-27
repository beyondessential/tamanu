import { Op } from 'sequelize';
import * as yup from 'yup';
import { VITALS_DATA_ELEMENT_IDS, SURVEY_TYPES } from 'shared/constants';
import { ImporterMetadataError, ValidationError } from '../errors';

const visualisationConfigSchema = yup.object().shape({
  yAxis: yup.object().shape({
    graphRange: yup.object().shape({
      min: yup.number().required(),
      max: yup.number().required(),
    }),
    normalRange: yup.object().shape({
      min: yup.number().required(),
      max: yup.number().required(),
    }),
    interval: yup.number().required(),
  }),
});

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

export function validateVisualisationConfigs(surveyInfo, questionRecords) {
  const { surveyType } = surveyInfo;

  const requiredQuestions = REQUIRED_QUESTION_IDS[surveyType];
  if (!requiredQuestions) {
    return;
  }

  questionRecords.forEach(record => {
    const { model, values } = record;
    const { visualisationConfig: visualisationConfigString, id } = values;
    if (model === 'ProgramDataElement' && visualisationConfigString) {
      const visualisationConfig = JSON.parse(visualisationConfigString);
      visualisationConfigSchema.validateSync(visualisationConfig);
    }
  });
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
