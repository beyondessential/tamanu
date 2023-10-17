import { createDummyPatient, randomReferenceId, randomUser } from '@tamanu/shared/demoData/patients';
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
    const result = await app.post('/v1/ongoingCondition').send({
      conditionId: await randomReferenceId(models, 'icd10'),
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
      conditionId: await randomReferenceId(models, 'icd10'),
      resolutionDate: '2023-02-18 00:00:00',
      resolutionPractitionerId: await randomUser(models),
      resolutionNote: 'Resolution Note',
    };

    const result = await app.post('/v1/ongoingCondition').send(dummyFormObject);

    expect(result.body).toMatchObject(dummyFormObject);
  });

  it('should require a valid diagnosis', async () => {
    const result = await app.post('/v1/ongoingCondition').send({
      conditionId: 'invalid id',
      patientId: patient.id,
      practitionerId: await randomUser(models),
    });
    expect(result).toHaveRequestError();
  });
});
