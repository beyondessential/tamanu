import { REFERENCE_TYPES, IMAGING_REQUEST_STATUS_TYPES } from '../constants';
import { fakeUUID } from '../utils/generateId';
import {
  fakeAdministeredVaccine,
  fakeEncounter,
  fakeEncounterDiagnosis,
  fakeEncounterMedication,
  fakeProgramDataElement,
  fakeReferenceData,
  fakeScheduledVaccine,
  fakeStringFields,
  fakeSurvey,
  fakeSurveyResponse,
  fakeSurveyResponseAnswer,
  fakeUser,
  fake,
} from './fake';

// TODO: generic

export const buildEncounter = async (models, patientId, optionalEncounterId) => {
  const { Patient, User } = models;
  const patient = fake(Patient);
  if (patientId) {
    patient.id = patientId;
  }
  await Patient.upsert(patient);

  const examiner = fakeUser('examiner');
  await User.upsert(examiner);

  const encounter = fakeEncounter();
  if (optionalEncounterId !== undefined) {
    encounter.id = optionalEncounterId;
  }
  encounter.patientId = patient.id;
  encounter.examinerId = examiner.id;
  encounter.patientBillingTypeId = null;
  encounter.referralSourceId = null;
  encounter.locationId = await findOrCreateId(models, models.Location);
  encounter.departmentId = await findOrCreateId(models, models.Department);
  encounter.plannedLocationId = null;
  encounter.plannedLocationStartTime = null;

  return encounter;
};

export const buildNestedEncounter = async (models, patientId, optionalEncounterId) => {
  const encounter = await buildEncounter(models, patientId, optionalEncounterId);

  const scheduledVaccine = await fakeScheduledVaccine();
  await models.ScheduledVaccine.upsert(scheduledVaccine);

  const administeredVaccine = fakeAdministeredVaccine('test-', scheduledVaccine.id);
  administeredVaccine.encounterId = encounter.id;
  encounter.administeredVaccines = [administeredVaccine];

  const survey = fakeSurvey();
  await models.Survey.upsert(survey);

  const surveyResponse = fakeSurveyResponse();
  surveyResponse.encounterId = encounter.id;
  surveyResponse.surveyId = survey.id;
  encounter.surveyResponses = [surveyResponse];

  const programDataElement = fakeProgramDataElement();
  await models.ProgramDataElement.upsert(programDataElement);

  const surveyResponseAnswer = fakeSurveyResponseAnswer();
  surveyResponseAnswer.responseId = surveyResponse.id;
  surveyResponseAnswer.dataElementId = programDataElement.id;
  surveyResponse.answers = [surveyResponseAnswer];

  const diagnosis = fakeReferenceData();
  await models.ReferenceData.create(diagnosis);

  const encounterDiagnosis = fakeEncounterDiagnosis();
  encounterDiagnosis.encounterId = encounter.id;
  encounterDiagnosis.diagnosisId = diagnosis.id;
  encounter.diagnoses = [encounterDiagnosis];

  const medication = fakeReferenceData();
  await models.ReferenceData.create(medication);

  const encounterMedication = fakeEncounterMedication();
  encounterMedication.encounterId = encounter.id;
  encounterMedication.medicationId = medication.id;
  encounterMedication.prescriberId = encounter.examinerId;
  encounter.medications = [encounterMedication];

  const labRequest = fake(models.LabRequest);
  labRequest.encounterId = encounter.id;
  encounter.labRequests = [labRequest];

  const labTest = fake(models.LabTest);
  labTest.labRequestId = labRequest.id;
  labRequest.tests = [labTest];

  const imagingRequest = {
    ...fake(models.ImagingRequest),
    status: IMAGING_REQUEST_STATUS_TYPES.COMPLETED,
    requestedById: encounter.examinerId,
  };
  imagingRequest.encounterId = encounter.id;
  encounter.imagingRequests = [imagingRequest];

  return encounter;
};

export const buildAdministeredVaccine = async (models, patientId) => {
  const encounter = await buildEncounter(models, patientId);
  await models.Encounter.upsert(encounter);

  const administeredVaccine = fakeAdministeredVaccine();
  administeredVaccine.encounterId = encounter.id;

  return administeredVaccine;
};

export const buildSurveyResponse = async (models, patientId) => {
  const encounter = await buildEncounter(models, patientId);
  await models.Encounter.upsert(encounter);

  const surveyResponse = fakeSurveyResponse();
  surveyResponse.encounterId = encounter.id;

  return surveyResponse;
};

export const buildSurveyResponseAnswer = async (models, patientId) => {
  const surveyResponse = await buildSurveyResponse(models, patientId);
  await models.SurveyResponse.upsert(surveyResponse);

  const surveyResponseAnswer = fakeSurveyResponseAnswer();
  surveyResponseAnswer.responseId = surveyResponse.id;

  return surveyResponseAnswer;
};

export const buildScheduledVaccine = async models => {
  const scheduledVaccine = fakeScheduledVaccine();

  const vaccineId = fakeUUID();
  const vaccine = {
    id: vaccineId,
    type: REFERENCE_TYPES.VACCINE,
    ...fakeStringFields(`vaccine_${vaccineId}_`, ['code', 'name']),
  };
  await models.ReferenceData.upsert(vaccine);
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

const addAssociations = async (models, model, record) => {
  const newRecord = { ...record };

  for (const association of Object.values(model.associations)) {
    const { associationType, foreignKey, target } = association;
    if (associationType === 'BelongsTo') {
      if (!newRecord[foreignKey]) {
        newRecord[foreignKey] = await findOrCreateId(models, target);
      }
    }
  }

  return newRecord;
};

export const findOneOrCreate = async (models, model, where, insertOverrides) => {
  const existingRecord = await model.findOne({ where });
  if (existingRecord) {
    return existingRecord;
  }

  const overrides = { ...where, ...insertOverrides };
  const values = await addAssociations(models, model, fake(model, overrides));
  return model.create(values);
};

const findOrCreateId = async (models, model) => (await findOneOrCreate(models, model)).id;
