import { Op } from 'sequelize';
import {
  SURVEY_TYPES,
  VITALS_DATA_ELEMENT_IDS,
  REGISTRATION_STATUSES_VALUES,
} from '@tamanu/constants';
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

export function ensureProgramRegistrationStatusOptionsAreValid(surveyInfo, questionRecords) {
  const { sheetName } = surveyInfo;
  const programDataElements = questionRecords.filter(
    record => record.model === 'ProgramDataElement',
  );
  const surveyScreenComponents = questionRecords.filter(
    record => record.model === 'SurveyScreenComponent',
  );

  surveyScreenComponents.forEach(ssc => {
    const pde = programDataElements.find(
      element => element.values.id === ssc.values.dataElementId,
    );
    if (pde.values.type !== 'PatientData') return;

    let fieldName;
    let fieldType;
    let defaultOptions;

    try {
      const config = JSON.parse(ssc.values.config);
      defaultOptions = JSON.parse(pde.values.defaultOptions);
      fieldName = config.writeToPatient.fieldName;
      fieldType = config.writeToPatient.fieldType;
    } catch (_) {
      // Malformed reference data will be caught later,
      // here we only care about a specific scenario
      return;
    }

    // This is the only scenario we're checking here
    if (fieldName !== 'programRegistrationStatus' || fieldType !== 'Select') return;

    // Ensure option values are correct
    const defaultOptionsValues = Object.values(defaultOptions);
    defaultOptionsValues.forEach(value => {
      if (REGISTRATION_STATUSES_VALUES.includes(value) === false) {
        throw new ValidationError(
          sheetName,
          -2,
          `Invalid options for patient data question with code: ${pde.values.code}`,
        );
      }
    });
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
