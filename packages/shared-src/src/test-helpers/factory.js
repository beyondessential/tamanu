import { v4 as uuidv4 } from 'uuid';

import { REFERENCE_TYPES } from 'shared/constants';
import {
  fakeAdministeredVaccine,
  fakeEncounter,
  fakeEncounterDiagnosis,
  fakeEncounterMedication,
  fakePatient,
  fakeProgramDataElement,
  fakeReferenceData,
  fakeScheduledVaccine,
  fakeStringFields,
  fakeSurvey,
  fakeSurveyResponse,
  fakeSurveyResponseAnswer,
  fakeUser,
} from './fake';

// TODO: generic

export const buildEncounter = async (ctx, patientId) => {
  const patient = fakePatient();
  if (patientId) {
    patient.id = patientId;
  }
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

  const scheduledVaccine = await fakeScheduledVaccine();
  await ctx.models.ScheduledVaccine.upsert(scheduledVaccine);

  const administeredVaccine = fakeAdministeredVaccine('test-', scheduledVaccine.id);
  delete administeredVaccine.encounterId;
  encounter.administeredVaccines = [administeredVaccine];

  const survey = fakeSurvey();
  await ctx.models.Survey.upsert(survey);

  const surveyResponse = fakeSurveyResponse();
  delete surveyResponse.encounterId;
  surveyResponse.surveyId = survey.id;
  encounter.surveyResponses = [surveyResponse];

  const programDataElement = fakeProgramDataElement();
  await ctx.models.ProgramDataElement.upsert(programDataElement);

  const surveyResponseAnswer = fakeSurveyResponseAnswer();
  delete surveyResponseAnswer.responseId;
  surveyResponseAnswer.dataElementId = programDataElement.id;
  surveyResponse.answers = [surveyResponseAnswer];

  const diagnosis = fakeReferenceData();
  await ctx.models.ReferenceData.create(diagnosis);

  const encounterDiagnosis = fakeEncounterDiagnosis();
  delete encounterDiagnosis.encounterId;
  encounterDiagnosis.diagnosisId = diagnosis.id;
  encounter.diagnoses = [encounterDiagnosis];

  const medication = fakeReferenceData();
  await ctx.models.ReferenceData.create(medication);

  const encounterMedication = fakeEncounterMedication();
  delete encounterMedication.encounterId;
  encounterMedication.medicationId = medication.id;
  encounterMedication.prescriberId = encounter.examinerId;
  encounter.medications = [encounterMedication];

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

export const upsertAssociations = async (model, record) => {
  for (const [name, association] of Object.entries(model.associations)) {
    const associatedRecords = record[name];
    if (associatedRecords) {
      for (const associatedRecord of associatedRecords) {
        await association.target.upsert({
          ...associatedRecord,
          [association.foreignKey]: record.id,
        });
        await upsertAssociations(association.target, associatedRecord);
      }
    }
  }
};
