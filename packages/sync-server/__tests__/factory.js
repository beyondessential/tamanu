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

export const buildEncounter = (ctx, patientId) => async () => {
  const patient = fakePatient();
  patient.id = patientId;
  await ctx.wrapper.upsert('patient', patient);

  const examiner = fakeUser('examiner');
  await ctx.wrapper.upsert('user', examiner);

  const location = fakeReferenceData('location');
  await ctx.wrapper.upsert('reference', location);

  const department = fakeReferenceData('department');
  await ctx.wrapper.upsert('reference', department);

  const encounter = fakeEncounter();
  encounter.patientId = patient.id;
  encounter.examinerId = examiner.id;
  encounter.locationId = location.id;
  encounter.departmentId = department.id;

  return encounter;
};

export const buildNestedEncounter = (ctx, patientId) => async () => {
  const encounter = await buildEncounter(ctx, patientId)();

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

export const buildAdministeredVaccine = (ctx, patientId) => async () => {
  const encounter = await buildEncounter(ctx, patientId)();
  await ctx.wrapper.upsert(`patient/${patientId}/encounter`, encounter);

  const administeredVaccine = fakeAdministeredVaccine();
  administeredVaccine.encounterId = encounter.id;

  return administeredVaccine;
};

export const buildSurveyResponse = (ctx, patientId) => async () => {
  const encounter = await buildEncounter(ctx, patientId)();
  await ctx.wrapper.upsert(`patient/${patientId}/encounter`, encounter);

  const surveyResponse = fakeSurveyResponse();
  surveyResponse.encounterId = encounter.id;

  return surveyResponse;
};

export const buildSurveyResponseAnswer = (ctx, patientId) => async () => {
  const surveyResponse = await buildSurveyResponse(ctx, patientId)();
  await ctx.wrapper.upsert(`patient/${patientId}/surveyResponse`, surveyResponse);

  const surveyResponseAnswer = fakeSurveyResponseAnswer();
  surveyResponseAnswer.responseId = surveyResponse.id;

  return surveyResponseAnswer;
};

export const buildScheduledVaccine = ctx => async () => {
  const scheduledVaccine = fakeScheduledVaccine();

  const vaccineId = uuidv4();
  const vaccine = {
    id: vaccineId,
    type: REFERENCE_TYPES.VACCINE,
    ...fakeStringFields(`vaccine_${vaccineId}_`, ['code', 'name']),
  };
  await ctx.wrapper.upsert('reference', vaccine);
  scheduledVaccine.vaccineId = vaccineId;

  return scheduledVaccine;
};
