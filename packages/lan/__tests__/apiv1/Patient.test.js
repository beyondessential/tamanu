import { createDummyPatient, randomReferenceId } from 'shared/demoData/patients';
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
    expect(result.body).toHaveProperty('title', patient.title);
  });

  test.todo('should get a list of patient conditions');
  test.todo('should get a list of patient allergies');
  test.todo('should get a list of patient family history entries');
  test.todo('should get a list of patient issues');

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
      expect(result.body).toHaveProperty('title', newPatient.title);
    });

    it('should update patient details', async () => {
      // skip middleName, to be added in PUT request
      const newPatient = await createDummyPatient(models, { middleName: '' });
      const result = await app.post('/v1/patient').send(newPatient);
      expect(result.body.middleName).toBeNull();

      const newVillage = await randomReferenceId(models, 'village');
      const updateResult = await app.put(`/v1/patient/${result.body.id}`).send({
        villageId: newVillage,
        middleName: 'MiddleName',
      });

      expect(updateResult).toHaveSucceeded();
      expect(updateResult.body).toHaveProperty('villageId', newVillage);
      expect(updateResult.body).toHaveProperty('middleName', 'MiddleName');
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
