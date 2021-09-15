import { createDummyPatient, randomDate } from 'shared/demoData/patients';
import { APPOINTMENT_TYPES, APPOINTMENT_STATUSES } from 'shared/constants';
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
      clinicianId: userApp.user.dataValues.id,
    });
    expect(result).toHaveSucceeded();
    expect(result.body.patientId).toEqual(patient.id);
    expect(result.body.status).toEqual(APPOINTMENT_STATUSES.CONFIRMED);
    expect(result.body.type).toEqual(APPOINTMENT_TYPES.STANDARD);
    expect(result.body.clinicianId).toEqual(userApp.user.dataValues.id);
  });
  it('should list appointments', async () => {
    const result = await userApp.get('/v1/appointments');
    expect(result).toHaveSucceeded();
    expect(result.body).toEqual([{foo: 'bar'}]);
  });
});
