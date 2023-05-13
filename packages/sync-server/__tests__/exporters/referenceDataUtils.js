import { createDummyEncounter, createDummyPatient } from 'shared/demoData/patients';
import { createAdministeredVaccine, createScheduledVaccine } from 'shared/demoData/vaccines';
import { VACCINE_CATEGORIES } from 'shared/constants';

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

export async function createPermission(models, { verb, noun, objectId, roleId }) {
  await models.Permission.create({
    verb,
    noun,
    objectId,
    roleId,
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

export async function createAdministedVaccine(models, vaccine) {
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
