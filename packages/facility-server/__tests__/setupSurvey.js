import { Chance } from 'chance';

import { SYNDROMIC_SURVEILLANCE_SURVEY_ID } from '@tamanu/constants';
import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { setupSurveyFromObject } from '@tamanu/database/demoData/surveys';
import { fake } from '@tamanu/fake-data/fake';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

const chance = new Chance();

export const SYNDROMIC_SURVEILLANCE_TEST_DATA_ELEMENT_ID = 'pde-SyndromicSurveillanceFever';

/**
 * The syndromic surveillance form has a fixed id and test files can share a database, so this
 * reuses the form if another file has already set it up.
 */
export const findOrSetupSyndromicSurveillanceSurvey = async models => {
  const existingSurvey = await models.Survey.findByPk(SYNDROMIC_SURVEILLANCE_SURVEY_ID);
  if (existingSurvey) return existingSurvey;

  const { survey } = await setupSurveyFromObject(models, {
    program: {
      id: 'program-syndromicsurveillance',
      code: 'syndromicsurveillance',
      name: 'Syndromic surveillance',
    },
    survey: { id: SYNDROMIC_SURVEILLANCE_SURVEY_ID, code: 'syndromicsurveillance' },
    questions: [{ name: 'SyndromicSurveillanceFever', type: 'FreeText' }],
  });
  return survey;
};

export const setupSurvey = async ({
  models,
  surveyName = chance.word(),
  programName = chance.word(),
  submissionDate = null,
  endTime = getCurrentDateTimeString(),
  surveyEncounterId,
  patientId,
  withReferral,
} = {}) => {
  let patient = { id: patientId };
  if (!patientId) {
    patient = await models.Patient.create(await createDummyPatient(models));
  }

  let encounter;
  let encounterId = surveyEncounterId;
  if (!encounterId) {
    encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });

    encounterId = encounter.id;
  }

  const program = await models.Program.create({
    name: programName,
  });
  const survey = await models.Survey.create({
    programId: program.id,
    name: surveyName,
  });

  const surveyResponse = await models.SurveyResponse.create({
    surveyId: survey.id,
    encounterId,
    endTime,
  });

  const dataElement =
    withReferral &&
    (await models.ProgramDataElement.create({
      ...fake(models.ProgramDataElement),
      type: 'SubmissionDate',
    }));

  const surveyResponseAnswer =
    withReferral &&
    (await models.SurveyResponseAnswer.create({
      ...fake(models.SurveyResponseAnswer),
      dataElementId: dataElement.id,
      responseId: surveyResponse.id,
      body: submissionDate,
    }));

  const referral =
    withReferral &&
    (await models.Referral.create({
      initiatingEncounterId: encounterId,
      surveyResponseId: surveyResponse.id,
    }));

  return { patient, encounter, survey, surveyResponse, program, surveyResponseAnswer, referral };
};
