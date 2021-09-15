import { createDummyPatient, randomDate } from 'shared/demoData/patients';
import { createTestContext } from '../utilities';

describe('Appointments', () => {
  let baseApp;
  let models;
  let userApp;
  let patient;

  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    userApp = await baseApp.asRole('practitioner');
    patient = await models.Patient.create(await createDummyPatient(models));
  });
  it('should create a new appointment', async () => {
    const result = await userApp.post('/v1/appointments').send({
      patientId: patient.id,
      startTime: randomDate(),
    });
    expect(result).toHaveSucceeded();
    expect(result.body).toEqual({
      id: 'testId',
      startTime: 'starttime',
      type: 'standard',
      status: 'confirmed,'
    });
  });
});
