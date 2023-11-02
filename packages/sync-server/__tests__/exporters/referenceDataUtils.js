import { createDummyEncounter, createDummyPatient } from '@tamanu/shared/demoData/patients';
import { PATIENT_FIELD_DEFINITION_TYPES } from '@tamanu/constants/patientFields';
import {
  createAdministeredVaccine,
  createScheduledVaccine,
} from '@tamanu/shared/demoData/vaccines';
import { VACCINE_CATEGORIES } from '@tamanu/constants';

export async function createDiagnosis(models) {
  await models.ReferenceData.create({
    type: 'icd10',
    code: 'M79.7',
    id: 'icd10-M79-7',
    name: 'Myofibrosis',
  });
  await models.ReferenceData.create({
    type: 'icd10',
    code: 'S79.9',
    id: 'icd10-S79-9',
    name: 'Thigh injury',
  });
}

export async function createTestType(models, data) {
  const testType = await models.LabTestType.create({ ...data });
  return testType;
}

export async function createLabTestPanel(models, { id, name, code, labTestTypesIds }) {
  const panel = await models.LabTestPanel.create({
    id,
    name,
    code,
  });

  for (const labTestTypeId of labTestTypesIds) {
    await models.LabTestPanelLabTestTypes.create({
      labTestPanelId: panel.id,
      labTestTypeId,
    });
  }
}

export async function createLabTestCategory(models, { id, name, code }) {
  const labTestCategory = await models.ReferenceData.create({
    id,
    name,
    code,
    type: 'labTestCategory',
  });

  return labTestCategory;
}

export async function createPatientFieldDefCategory(models) {
  await models.PatientFieldDefinitionCategory.create({
    id: '123',
    name: 'test 123',
  });
  await models.PatientFieldDefinitionCategory.create({
    id: '1234',
    name: 'test 1234',
  });
}

export async function createPatientFieldDefinitions(models) {
  await models.PatientFieldDefinition.create({
    id: 'fieldDefinition-primaryPolicyNumber',
    name: 'Primary policy number',
    fieldType: PATIENT_FIELD_DEFINITION_TYPES.STRING,
    categoryId: '123',
  });
  await models.PatientFieldDefinition.create({
    id: 'fieldDefinition-size',
    name: 'Size',
    fieldType: PATIENT_FIELD_DEFINITION_TYPES.SELECT,
    categoryId: '123',
    options: ['s', 'm', 'l'],
  });
}

export async function createAllergy(models) {
  await models.ReferenceData.create({
    type: 'allergy',
    code: 'Sesame',
    id: 'allergy-Sesame',
    name: 'Sesame',
  });
  await models.ReferenceData.create({
    type: 'allergy',
    code: 'Wheat',
    id: 'allergy-Wheat',
    name: 'Wheat',
  });
}

export async function createPermission(
  models,
  { verb, noun, objectId, roleId, deletionStatus = null },
) {
  await models.Permission.create({
    verb,
    noun,
    objectId,
    roleId,
    deletionStatus,
  });
}

export async function createRole(models, { id, name }) {
  await models.Role.create({
    id,
    name,
  });
}

export async function createDataForEncounter(models) {
  await models.User.create({
    displayName: 'Test User',
    email: 'testuser@test.test',
  });

  const facility = await models.Facility.create({
    name: 'Test facility',
    code: 'TESTFACILITY',
  });
  await models.Location.create({
    name: 'Test location',
    code: 'TESTLOCATION',
    facilityId: facility.id,
  });
  await models.Department.create({
    name: 'Test department',
    code: 'TESTDEPARTMENT',
    facilityId: facility.id,
  });
}

export async function createVaccine(models, { label, schedule }) {
  const vaccine = await models.ScheduledVaccine.create(
    await createScheduledVaccine(models, {
      category: VACCINE_CATEGORIES.ROUTINE,
      label,
      schedule,
    }),
  );

  return vaccine;
}

export async function createAdministeredVaccineData(models, vaccine) {
  const patient = await models.Patient.create(await createDummyPatient());

  const encounter = await models.Encounter.create(
    await createDummyEncounter(models, { patientId: patient.id }),
  );

  const administeredVaccine = await models.AdministeredVaccine.create(
    await createAdministeredVaccine(models, {
      scheduledVaccineId: vaccine.id,
      encounterId: encounter.id,
      consent: true,
    }),
  );

  return { encounter, administeredVaccine };
}
