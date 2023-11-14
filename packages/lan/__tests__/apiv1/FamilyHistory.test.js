import {
  createDummyPatient,
  randomReferenceId,
  randomUser,
} from '@tamanu/shared/demoData/patients';
import { createTestContext } from '../utilities';


describe('Family history', () => {
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

  it('should record family history', async () => {
    const result = await app.post('/v1/familyHistory').send({
      diagnosisId: await randomReferenceId(models, 'icd10'),
      patientId: patient.id,
      practitionerId: await randomUser(models),
      relationship: 'mother',
    });
    expect(result).toHaveSucceeded();
    expect(result.body.recordedDate).toBeTruthy();
  });

  it('should require a valid diagnosis', async () => {
    const result = await app.post('/v1/familyHistory').send({
      diagnosisId: 'invalid id',
      patientId: patient.id,
      practitionerId: await randomUser(models),
      relationship: 'mother',
    });
    expect(result).toHaveRequestError();
  });
});
