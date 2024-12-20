import { Op } from 'sequelize';
import { SURVEY_TYPES, VITALS_DATA_ELEMENT_IDS } from '@tamanu/constants';
import { ImporterMetadataError, ValidationError } from '../errors';

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

async function ensureOnlyOneVitalsSurveyExists({ models }, surveyInfo) {
  const vitalsCount = await models.Survey.count({
    where: {
      id: {
        [Op.not]: surveyInfo.id,
      },
      surveyType: SURVEY_TYPES.VITALS,
    },
  });
  if (vitalsCount > 0) {
    throw new ImporterMetadataError('Only one vitals survey may exist at a time');
  }
}

function ensureSurveyNonSensitive(surveyInfo, errorMessage) {
  if (surveyInfo.isSensitive) {
    throw new ImporterMetadataError(errorMessage);
  }
}

export async function validateVitalsSurvey(context, surveyInfo) {
  await ensureOnlyOneVitalsSurveyExists(context, surveyInfo);
  ensureSurveyNonSensitive(surveyInfo, 'Vitals survey can not be sensitive');
}

async function ensureOnlyOneComplexSurveySetPerProgram({ models }, surveyInfo) {
  const surveyCount = await models.Survey.count({
    where: {
      id: {
        [Op.not]: surveyInfo.id,
      },
      surveyType: surveyInfo.surveyType,
      programId: surveyInfo.programId,
    },
  });

  if (surveyCount > 0) {
    throw new ImporterMetadataError('Complex chart set already exists for this program');
  }
}

export async function validateChartingSurvey(context, surveyInfo) {
  if (surveyInfo.surveyType !== SURVEY_TYPES.SIMPLE_CHART) {
    await ensureOnlyOneComplexSurveySetPerProgram(context, surveyInfo);
  }
  ensureSurveyNonSensitive(surveyInfo, 'Charting survey can not be sensitive');
}
