import { createDummyPatient } from 'shared/demoData/patients';
import { createTestContext } from '../utilities';

describe('LabRequestLogs', () => {
  let patient = null;
  let app = null;
  let baseApp = null;
  let models = null;

  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
    patient = await models.Patient.create(await createDummyPatient(models));
  });

  it('should add a lab request log', async () => {
    const result = await app.post('/v1/immunisation').send({
      patientId: patient.id,
      givenById: app.user.id,
      date: Date.now(),
      schedule: '24 hours after birth',
      batch: 'ifz-0101',
      timeliness: 'On time',
    });
    expect(result).toHaveSucceeded();
    expect(result.body.date).toBeTruthy();
  });
});
