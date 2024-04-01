import config from 'config';
import { Op } from 'sequelize';
import { SURVEY_TYPES, VITALS_DATA_ELEMENT_IDS } from '@tamanu/constants';
import { ImporterMetadataError, ValidationError } from '../errors';
import { statkey, updateStat } from '../stats';

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

export async function ensurePatientFieldsExist(
  records,
  { context, sheetName, stats: previousStats = {} },
) {
  // if (!config.validateQuestionConfigs.enabled) {
  //   return previousStats;
  // }

  const surveyScreenComponents = records.filter(({ model }) => model === 'SurveyScreenComponent');
  const stats = { ...previousStats };
  const { models } = context;
  const { PatientAdditionalData, PatientFieldDefinition } = models;
  const PatientAdditionalDataFields = Object.keys(PatientAdditionalData.rawAttributes);

  for (const question of surveyScreenComponents) {
    // Safely get config from question
    const config = question.values?.config ? question.values?.config : null;
    let jsonConfig = config;
    try {
      if (typeof config !== 'object') {
        jsonConfig = JSON.parse(config);
      }
    } catch (error) {
      console.log('error', error);
    }
    const column = jsonConfig?.column;

    if (column) {
      // Check if import question references a patient additional data field
      const isPADField = Boolean(PatientAdditionalDataFields.includes(column));
      if (isPADField) {
        continue;
      }

      // Check if import question references a custom patient field
      const isCustomPatientField = Boolean(await PatientFieldDefinition.findByPk(column));
      if (isCustomPatientField) {
        continue;
      }
      // If not, throw an error
      updateStat(stats, statkey('SurveyScreenComponent', sheetName), 'errored', 1);
    }
  }

  console.log('stats', stats);

  return stats;
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
