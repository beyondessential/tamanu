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
  patient.data.id = patientId;
  await ctx.wrapper.insert('patient', patient);

  const examiner = fakeUser('examiner');
  await ctx.wrapper.insert('user', examiner);

  const location = fakeReferenceData('location');
  await ctx.wrapper.insert('reference', location);

  const department = fakeReferenceData('department');
  await ctx.wrapper.insert('reference', department);

  const encounter = fakeEncounter();
  encounter.data.patientId = patient.data.id;
  encounter.data.examinerId = examiner.data.id;
  encounter.data.locationId = location.data.id;
  encounter.data.departmentId = department.data.id;

  return encounter;
};

export const buildAdministeredVaccine = (ctx, patientId) => async () => {
  const encounter = await buildEncounter(ctx, patientId)();
  await ctx.wrapper.insert(`patient/${patientId}/encounter`, encounter);

  const administeredVaccine = fakeAdministeredVaccine();
  administeredVaccine.data.encounterId = encounter.data.id;

  return administeredVaccine;
};

export const buildSurveyResponse = (ctx, patientId) => async () => {
  const encounter = await buildEncounter(ctx, patientId)();
  await ctx.wrapper.insert(`patient/${patientId}/encounter`, encounter);

  const surveyResponse = fakeSurveyResponse();
  surveyResponse.data.encounterId = encounter.data.id;

  return surveyResponse;
};

export const buildSurveyResponseAnswer = (ctx, patientId) => async () => {
  const surveyResponse = await buildSurveyResponse(ctx, patientId)();
  await ctx.wrapper.insert(`patient/${patientId}/surveyResponse`, surveyResponse);

  const surveyResponseAnswer = fakeSurveyResponseAnswer();
  surveyResponseAnswer.data.responseId = surveyResponse.data.id;

  return surveyResponseAnswer;
};

export const buildScheduledVaccine = ctx => async () => {
  const scheduledVaccine = fakeScheduledVaccine();

  const vaccineId = uuidv4();
  const vaccine = {
    data: {
      id: vaccineId,
      type: REFERENCE_TYPES.VACCINE,
      ...fakeStringFields(`vaccine_${vaccineId}_`, ['code', 'name']),
    },
  };
  await ctx.wrapper.insert('reference', vaccine);
  scheduledVaccine.data.vaccineId = vaccineId;

  return scheduledVaccine;
};
