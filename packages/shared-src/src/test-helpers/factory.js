import { v4 as uuidv4 } from 'uuid';

import { REFERENCE_TYPES } from 'shared/constants';
import {
  fakeAdministeredVaccine,
  fakeEncounter,
  fakePatient,
  fakeReferenceData,
  fakeScheduledVaccine,
  fakeStringFields,
  fakeSurveyResponse,
  fakeSurveyResponseAnswer,
  fakeUser,
} from './fake';

// TODO: generic

export const buildEncounter = async (ctx, patientId) => {
  const patient = fakePatient();
  patient.id = patientId;
  await ctx.models.Patient.upsert(patient);

  const examiner = fakeUser('examiner');
  await ctx.models.User.upsert(examiner);

  const location = fakeReferenceData('location');
  await ctx.models.ReferenceData.upsert(location);

  const department = fakeReferenceData('department');
  await ctx.models.ReferenceData.upsert(department);

  const encounter = fakeEncounter();
  encounter.patientId = patient.id;
  encounter.examinerId = examiner.id;
  encounter.locationId = location.id;
  encounter.departmentId = department.id;

  return encounter;
};

export const buildNestedEncounter = async (ctx, patientId) => {
  const encounter = await buildEncounter(ctx, patientId);

  const administeredVaccine = fakeAdministeredVaccine();
  delete administeredVaccine.encounterId;
  encounter.administeredVaccines = [administeredVaccine];

  const surveyResponse = fakeSurveyResponse();
  delete surveyResponse.encounterId;
  encounter.surveyResponses = [surveyResponse];

  const surveyResponseAnswer = fakeSurveyResponseAnswer();
  delete surveyResponseAnswer.responseId;
  surveyResponse.answers = [surveyResponseAnswer];

  return encounter;
};

export const buildAdministeredVaccine = async (ctx, patientId) => {
  const encounter = await buildEncounter(ctx, patientId);
  await ctx.models.Encounter.upsert(encounter);

  const administeredVaccine = fakeAdministeredVaccine();
  administeredVaccine.encounterId = encounter.id;

  return administeredVaccine;
};

export const buildSurveyResponse = async (ctx, patientId) => {
  const encounter = await buildEncounter(ctx, patientId);
  await ctx.models.Encounter.upsert(encounter);

  const surveyResponse = fakeSurveyResponse();
  surveyResponse.encounterId = encounter.id;

  return surveyResponse;
};

export const buildSurveyResponseAnswer = async (ctx, patientId) => {
  const surveyResponse = await buildSurveyResponse(ctx, patientId);
  await ctx.models.SurveyResponse.upsert(surveyResponse);

  const surveyResponseAnswer = fakeSurveyResponseAnswer();
  surveyResponseAnswer.responseId = surveyResponse.id;

  return surveyResponseAnswer;
};

export const buildScheduledVaccine = async ctx => {
  const scheduledVaccine = fakeScheduledVaccine();

  const vaccineId = uuidv4();
  const vaccine = {
    id: vaccineId,
    type: REFERENCE_TYPES.VACCINE,
    ...fakeStringFields(`vaccine_${vaccineId}_`, ['code', 'name']),
  };
  await ctx.models.ReferenceData.upsert(vaccine);
  scheduledVaccine.vaccineId = vaccineId;

  return scheduledVaccine;
};
