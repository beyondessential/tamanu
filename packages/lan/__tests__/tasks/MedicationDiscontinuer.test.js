import {
  createDummyPatient,
  createDummyEncounter,
  createDummyEncounterMedication,
} from 'shared/demoData/patients';
import moment from 'moment';
import { createTestContext } from '../utilities';
import { MedicationDiscontinuer } from '../../app/tasks/MedicationDiscontinuer';

// Mock config to add custom serverFacilityId.
// It can't be done through test.json file in config because
// local.json will have priority and will overwrite it.
// Plus, it's better to have a unique facilityId to test this
jest.mock(
  'config',
  () => ({
    serverFacilityId: 'test-facility-id-for-discontinuer',
    schedules: {
      medicationDiscontinuer: {
        schedule: '',
      },
    },
  }),
  { virtual: true },
);

describe('Encounter', () => {
  let context = null;
  let models = null;
  let patient = null;
  let encounter = null;
  let testFacility = null;
  let testDepartment = null;
  let discontinuer = null;

  // Create times
  const tomorrow = moment()
    .add(1, 'day')
    .toDate();
  const today = moment().toDate();
  const yesterday = moment()
    .subtract(1, 'day')
    .toDate();
  const twoDaysAgo = moment()
    .subtract(2, 'day')
    .toDate();
  const threeDaysAgo = moment()
    .subtract(3, 'day')
    .toDate();

  beforeAll(async () => {
    context = await createTestContext();
    models = context.models;
    await context.baseApp.asRole('practitioner');
    patient = await models.Patient.create(await createDummyPatient(models));

    // Create a facility with an id that matches the one in test.json config
    testFacility = await models.Facility.create({
      id: 'test-facility-id-for-discontinuer',
      code: 'testFacility',
      name: 'test facility',
    });

    // Create a department that points to said facility
    testDepartment = await models.Department.create({
      name: 'test department',
      code: 'testDepartment',
      facilityId: testFacility.id,
    });

    // Create needed encounter for creating medications, point it to test department
    encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models, { current: true })),
      patientId: patient.id,
      departmentId: testDepartment.id,
    });

    // Avoid running on instantiation with debug true and properly await for it
    discontinuer = new MedicationDiscontinuer(context, true);
  });

  afterEach(async () => {
    // Destroy all instances to avoid leftover data
    await models.EncounterMedication.destroy({ where: {} });
  });

  it('should only autodiscontinue medications past their end date (compared to start of today)', async () => {
    await models.EncounterMedication.bulkCreate([
      {
        ...(await createDummyEncounterMedication(models)),
        date: today,
        endDate: tomorrow,
        encounterId: encounter.id,
      },
      {
        ...(await createDummyEncounterMedication(models)),
        date: yesterday,
        endDate: today,
        encounterId: encounter.id,
      },
      {
        ...(await createDummyEncounterMedication(models)),
        date: twoDaysAgo,
        endDate: yesterday,
        encounterId: encounter.id,
      },
      {
        ...(await createDummyEncounterMedication(models)),
        date: threeDaysAgo,
        endDate: twoDaysAgo,
        encounterId: encounter.id,
      },
    ]);

    const medications = await models.EncounterMedication.findAndCountAll();
    expect(medications.count).toBe(4);

    await discontinuer.run();
    const discontinuedMedications = await models.EncounterMedication.findAndCountAll({
      where: {
        discontinued: true,
      },
    });
    expect(discontinuedMedications.count).toBe(2);
  });

  it('should not autodiscontinue medications with null end date', async () => {
    await models.EncounterMedication.bulkCreate([
      {
        ...(await createDummyEncounterMedication(models)),
        date: threeDaysAgo,
        endDate: twoDaysAgo,
        encounterId: encounter.id,
      },
      {
        ...(await createDummyEncounterMedication(models)),
        date: threeDaysAgo,
        endDate: null,
        encounterId: encounter.id,
      },
    ]);

    const medications = await models.EncounterMedication.findAndCountAll();
    expect(medications.count).toBe(2);

    await discontinuer.run();
    const discontinuedMedications = await models.EncounterMedication.findAndCountAll({
      where: {
        discontinued: true,
      },
    });
    expect(discontinuedMedications.count).toBe(1);
  });

  it('should only autodiscontinue medications from its facility', async () => {
    // Create a different facility
    const otherFacility = await models.Facility.create({
      id: 'other-facility-for-discontinuer',
      code: 'otherFacility',
      name: 'other facility',
    });

    // Create a new department that points out to a different facility
    const otherDepartment = await models.Department.create({
      name: 'other department',
      code: 'otherDepartment',
      facilityId: otherFacility.id,
    });

    // Create separate encounter that points out to a different department
    const encounterTwo = await models.Encounter.create({
      ...(await createDummyEncounter(models, { current: true })),
      patientId: patient.id,
      departmentId: otherDepartment.id,
    });

    await models.EncounterMedication.bulkCreate([
      {
        ...(await createDummyEncounterMedication(models)),
        date: twoDaysAgo,
        endDate: yesterday,
        encounterId: encounter.id,
      },
      {
        ...(await createDummyEncounterMedication(models)),
        date: twoDaysAgo,
        endDate: yesterday,
        encounterId: encounterTwo.id,
      },
    ]);

    const medications = await models.EncounterMedication.findAndCountAll();
    expect(medications.count).toBe(2);

    await discontinuer.run();
    const discontinuedMedications = await models.EncounterMedication.findAndCountAll({
      where: {
        discontinued: true,
      },
    });
    expect(discontinuedMedications.count).toBe(1);
  });

  it('should update the updated_at column accordingly when autodiscontinuing a medication', async () => {
    const medication = await models.EncounterMedication.create({
      ...(await createDummyEncounterMedication(models)),
      date: threeDaysAgo,
      endDate: twoDaysAgo,
      encounterId: encounter.id,
    });

    // Get initial time and guarantee a 1ms difference
    const initialUpdatedAt = medication.updatedAt.getTime();
    await new Promise(resolve => setTimeout(() => resolve(), 1));

    await discontinuer.run();
    const discontinuedMedications = await models.EncounterMedication.findAndCountAll({
      where: {
        discontinued: true,
      },
    });
    expect(discontinuedMedications.count).toBe(1);
    const currentUpdatedAt = discontinuedMedications.rows[0].updatedAt.getTime();
    expect(initialUpdatedAt).toBeLessThan(currentUpdatedAt);
  });
});
