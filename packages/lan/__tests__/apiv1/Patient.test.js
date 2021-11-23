import {
  createDummyEncounter,
  createDummyEncounterMedication,
  createDummyPatient,
  randomReferenceId,
} from 'shared/demoData/patients';
import { createTestContext } from '../utilities';

describe('Patient', () => {
  let app = null;
  let baseApp = null;
  let models = null;
  let patient = null;

  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
    patient = await models.Patient.create(await createDummyPatient(models));
  });

  it('should reject reading a patient with insufficient permissions', async () => {
    const noPermsApp = await baseApp.asRole('base');
    const result = await noPermsApp.get(`/v1/patient/${patient.id}`);
    expect(result).toBeForbidden();
  });

  test.todo('should create an access record');

  test.todo('should get a list of patients matching a filter');
  test.todo('should reject listing of patients with insufficient permissions');

  it('should get the details of a patient', async () => {
    const result = await app.get(`/v1/patient/${patient.id}`);
    expect(result).toHaveSucceeded();
    expect(result.body).toHaveProperty('displayId', patient.displayId);
    expect(result.body).toHaveProperty('firstName', patient.firstName);
    expect(result.body).toHaveProperty('lastName', patient.lastName);
  });

  test.todo('should get a list of patient conditions');
  test.todo('should get a list of patient allergies');
  test.todo('should get a list of patient family history entries');
  test.todo('should get a list of patient issues');

  it('should get empty results when checking for last discharged encounter medications', async () => {
    // Create encounter without endDate (not discharged yet)
    await models.Encounter.create({
      ...(await createDummyEncounter(models, { current: true })),
      patientId: patient.id,
    });

    // Expect result data to be empty since there are no discharged encounters or medications
    const result = await app.get(`/v1/patient/${patient.id}/lastDischargedEncounterMedications`);
    expect(result).toHaveSucceeded();
    expect(result.body).toMatchObject({
      count: 0,
      data: [],
    });
  });

  it('should get the last discharged encounter and include discharged medications', async () => {
    // Create three encounters: First two will be discharged, the last one won't
    const encounterOne = await models.Encounter.create({
      ...(await createDummyEncounter(models, { current: true })),
      patientId: patient.id,
    });
    const encounterTwo = await models.Encounter.create({
      ...(await createDummyEncounter(models, { current: true })),
      patientId: patient.id,
    });
    await models.Encounter.create({
      ...(await createDummyEncounter(models, { current: true })),
      patientId: patient.id,
    });

    // Create two medications for encounterTwo (the one we should get)
    const dischargedMedication = await models.EncounterMedication.create({
      ...(await createDummyEncounterMedication(models, { isDischarge: true })),
      encounterId: encounterTwo.id,
    });
    await models.EncounterMedication.create({
      ...(await createDummyEncounterMedication(models)),
      encounterId: encounterTwo.id,
    });

    // Edit the first two encounters to simulate a discharge
    // (the second one needs to have a 'greater' date to be the last)
    const endDate = new Date();
    await Promise.all([
      encounterOne.update({ endDate: endDate }),
      encounterTwo.update({ endDate: new Date(endDate.getTime() + 1000) }),
    ]);

    // Expect encounter to be the second encounter discharged
    // and include discharged medication with reference associations
    const result = await app.get(`/v1/patient/${patient.id}/lastDischargedEncounterMedications`);
    expect(result).toHaveSucceeded();
    expect(result.body).toMatchObject({
      count: 1,
      data: expect.any(Array),
    });
    expect(result.body.data[0]).toMatchObject({
      id: dischargedMedication.id,
      medication: expect.any(Object),
      encounter: {
        location: expect.any(Object),
      },
    });
  });

  describe('write', () => {
    it('should reject users with insufficient permissions', async () => {
      const noPermsApp = await baseApp.asRole('base');

      const result = await noPermsApp.put(`/v1/patient/${patient.id}`).send({
        firstName: 'New',
      });

      expect(result).toBeForbidden();
    });

    it('should create a new patient', async () => {
      const newPatient = await createDummyPatient(models);
      const result = await app.post('/v1/patient').send(newPatient);
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveProperty('displayId', newPatient.displayId);
      expect(result.body).toHaveProperty('firstName', newPatient.firstName);
      expect(result.body).toHaveProperty('lastName', newPatient.lastName);
    });

    it('should create a new patient with additional data', async () => {
      const newPatient = await createDummyPatient(models);
      const result = await app.post('/v1/patient').send({
        ...newPatient,
        passport: 'TEST-PASSPORT',
      });

      expect(result).toHaveSucceeded();

      const id = result.body.id;
      const additional = await models.PatientAdditionalData.findOne({ where: { patientId: id } });
      expect(additional).toBeTruthy();
      expect(additional).toHaveProperty('passport', 'TEST-PASSPORT');
    });

    it('should update patient details', async () => {
      // skip middleName, to be added in PUT request
      const newPatient = await createDummyPatient(models, { middleName: '' });
      const result = await app.post('/v1/patient').send(newPatient);
      expect(result.body.middleName).toEqual('');

      const newVillage = await randomReferenceId(models, 'village');
      const updateResult = await app.put(`/v1/patient/${result.body.id}`).send({
        villageId: newVillage,
        middleName: 'MiddleName',
        bloodType: 'AB+',
      });

      expect(updateResult).toHaveSucceeded();
      expect(updateResult.body).toHaveProperty('villageId', newVillage);
      expect(updateResult.body).toHaveProperty('middleName', 'MiddleName');

      const additionalDataResult = await app.get(`/v1/patient/${result.body.id}/additionalData`);

      expect(additionalDataResult).toHaveSucceeded();
      expect(additionalDataResult.body).toHaveProperty('bloodType', 'AB+');
    });

    test.todo('should create a new patient as a new birth');

    test.todo('should add a new condition');
    test.todo('should edit an existing condition');
    test.todo('should add a new allergy');
    test.todo('should edit an existing allergy');
    test.todo('should add a new family history entry');
    test.todo('should edit an existing family history entry');
    test.todo('should add a new issue');
    test.todo('should edit an existing issue');
  });

  describe('merge', () => {
    test.todo('should merge two patients into a single record');
  });

  test.todo('should get a list of patient encounters');
  test.todo('should get a list of patient appointments');
  test.todo('should get a list of patient referrals');

  describe('Death', () => {
    test.todo('should mark a patient as dead');
    test.todo('should not mark a dead patient as dead');
  });
});
