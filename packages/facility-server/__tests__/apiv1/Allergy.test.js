import {
  createDummyPatient,
  randomReferenceId,
  randomUser,
} from '@tamanu/shared/demoData/patients';
import { createTestContext } from '../utilities';

describe('Allergy', () => {
  let ctx = null;
  let patient = null;
  let app = null;
  let baseApp = null;
  let models = null;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
    patient = await models.Patient.create(await createDummyPatient(models));
  });
  afterAll(() => ctx.close());

  it('should record an allergy', async () => {
    const result = await app.post('/v1/allergy').send({
      allergyId: await randomReferenceId(models, 'allergy'),
      patientId: patient.id,
      practitionerId: await randomUser(models),
    });
    expect(result).toHaveSucceeded();
    expect(result.body.recordedDate).toBeTruthy();
  });

  it('should require a valid allergy', async () => {
    const result = await app.post('/v1/allergy').send({
      allergyId: 'invalid id',
      patientId: patient.id,
      practitionerId: await randomUser(models),
    });
    expect(result).toHaveRequestError();
  });
});
