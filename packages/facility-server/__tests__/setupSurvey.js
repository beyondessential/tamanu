import { Chance } from 'chance';

import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { fake } from '@tamanu/fake-data/fake';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

const chance = new Chance();

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
