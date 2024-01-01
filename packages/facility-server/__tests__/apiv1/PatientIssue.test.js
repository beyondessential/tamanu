import { createDummyPatient } from '@tamanu/shared/demoData/patients';
import { createTestContext } from '../utilities';

describe('PatientIssue', () => {
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

  it('should record an issue', async () => {
    const result = await app.post('/v1/patientIssue').send({
      patientId: patient.id,
      note: 'A patient issue',
    });
    expect(result).toHaveSucceeded();
    expect(result.body.recordedDate).toBeTruthy();
  });

  it('should require a valid patient', async () => {
    const result = await app.post('/v1/patientIssue').send({
      patientId: 'not a patient',
      note: 'A patient issue',
    });
    expect(result).toHaveRequestError();
  });
});
