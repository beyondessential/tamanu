import {
  createDummyPatient,
  randomReferenceId,
  randomUser,
} from '@tamanu/database/demoData/patients';
import { createTestContext } from '../utilities';

describe('Ongoing conditions', () => {
  let patient = null;
  let app = null;
  let baseApp = null;
  let models = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
    patient = await models.Patient.create(await createDummyPatient(models));
  });
  afterAll(() => ctx.close());

  it('should record an ongoing condition', async () => {
    const result = await app.post('/api/ongoingCondition').send({
      conditionId: await randomReferenceId(models, 'diagnosis'),
      patientId: patient.id,
      examinerId: await randomUser(models),
    });
    expect(result).toHaveSucceeded();
    expect(result.body.recordedDate).toBeTruthy();
  });

  it('should save all fields from a submitted form including resolved', async () => {
    const dummyFormObject = {
      note: 'Initial Note',
      recordedDate: '2023-02-17 10:50:15',
      resolved: true,
      patientId: patient.id,
      examinerId: await randomUser(models),
      conditionId: await randomReferenceId(models, 'diagnosis'),
      resolutionDate: '2023-02-18 00:00:00',
      resolutionPractitionerId: await randomUser(models),
      resolutionNote: 'Resolution Note',
    };

    const result = await app.post('/api/ongoingCondition').send(dummyFormObject);

    expect(result.body).toMatchObject(dummyFormObject);
  });

  it('should require a valid diagnosis', async () => {
    const result = await app.post('/api/ongoingCondition').send({
      conditionId: 'invalid id',
      patientId: patient.id,
      practitionerId: await randomUser(models),
    });
    expect(result).toHaveRequestError();
  });

  it('should delete an ongoing condition', async () => {
    // First create a condition
    const createResult = await app.post('/api/ongoingCondition').send({
      conditionId: await randomReferenceId(models, 'diagnosis'),
      patientId: patient.id,
      examinerId: await randomUser(models),
      note: 'Test condition for deletion',
    });
    expect(createResult).toHaveSucceeded();
    
    const conditionId = createResult.body.id;

    // Then delete it
    const deleteResult = await app.delete(`/api/ongoingCondition/${conditionId}`);
    expect(deleteResult).toHaveSucceeded();
    expect(deleteResult.body.message).toBe('Ongoing condition deleted successfully');

    // Verify it's soft deleted (should not be found in normal queries)
    const getResult = await app.get(`/api/ongoingCondition/${conditionId}`);
    expect(getResult).toHaveRequestError();
  });

  it('should return error when trying to delete non-existent condition', async () => {
    const result = await app.delete('/api/ongoingCondition/non-existent-id');
    expect(result).toHaveRequestError();
  });
});
