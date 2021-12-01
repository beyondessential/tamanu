import { createDummyPatient } from 'shared/demoData/patients';
import { createTestContext } from '../utilities';

describe('Immunisations', () => {
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

  it('should register an immunisation', async () => {
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

  it('should have a valid patient', async () => {
    const createdImmunisation = await models.Immunisation.create({
      patientId: patient.id,
      givenById: app.user.id,
      date: Date.now(),
      schedule: '24 hours after birth',
      batch: 'ifz-0101',
      timeliness: 'On time',
    });

    const result = await app.get(`/v1/patient/${patient.id}/immunisations`);
    expect(result).toHaveSucceeded();

    const { body } = result;

    expect(body.count).toBeGreaterThan(0);
    expect(body.data[0]).toHaveProperty('patientId', createdImmunisation.patientId);
    expect(body.data[0]).toHaveProperty('givenById', createdImmunisation.givenById);
  });

  it('should get immunisation info when listing immunisations', async () => {
    await models.Immunisation.create({
      patientId: patient.id,
      givenById: app.user.id,
      date: Date.now(),
      schedule: '24 hours after birth',
      batch: 'ifz-0101',
      timeliness: 'On time',
    });

    const result = await app.get(`/v1/patient/${patient.id}/immunisations`);
    expect(result).toHaveSucceeded();

    const { body } = result;
    expect(body.count).toBeGreaterThan(0);

    const record = body.data[0];
    expect(record).toHaveProperty('givenBy.displayName');
  });
});
