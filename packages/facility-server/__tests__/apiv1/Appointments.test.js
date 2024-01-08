import { createDummyPatient } from '@tamanu/shared/demoData/patients';
import { add } from 'date-fns';
import { APPOINTMENT_TYPES, APPOINTMENT_STATUSES } from '@tamanu/constants';
import { randomRecordId } from '@tamanu/shared/demoData/utilities';
import { createTestContext } from '../utilities';

describe('Appointments', () => {
  let baseApp;
  let models;
  let userApp;
  let patient;
  let appointment;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    userApp = await baseApp.asRole('practitioner');
    patient = await models.Patient.create(await createDummyPatient(models));
  });
  afterAll(() => ctx.close());
  it('should create a new appointment', async () => {
    const result = await userApp.post('/v1/appointments').send({
      patientId: patient.id,
      startTime: add(new Date(), { days: 1 }), // create a date in the future
      clinicianId: userApp.user.dataValues.id,
    });
    appointment = result.body;
    expect(result).toHaveSucceeded();
    expect(result.body.patientId).toEqual(patient.id);
    expect(result.body.status).toEqual(APPOINTMENT_STATUSES.CONFIRMED);
    expect(result.body.type).toEqual(APPOINTMENT_TYPES.STANDARD);
    expect(result.body.clinicianId).toEqual(userApp.user.dataValues.id);
  });
  it('should list appointments', async () => {
    const result = await userApp.get('/v1/appointments');
    expect(result).toHaveSucceeded();
    expect(result.body.count).toEqual(1);
    // verify that the appointment returned is the one created above
    expect(result.body.data[0].id).toEqual(appointment.id);
  });
  it('should be backwards compatible for appointments with locations', async () => {
    const locationId = await randomRecordId(models, 'Location');
    await models.Appointment.update(
      {
        locationId,
      },
      {
        where: { id: appointment.id },
      },
    );
    const result = await userApp.get('/v1/appointments');
    expect(result.body.data[0].locationGroup.id).toEqual(locationId);
  });
  it('should cancel an appointment', async () => {
    const result = await userApp.put(`/v1/appointments/${appointment.id}`).send({
      status: APPOINTMENT_STATUSES.CANCELLED,
    });
    expect(result).toHaveSucceeded();
    expect(result.body.status).toEqual(APPOINTMENT_STATUSES.CANCELLED);
    const getResult = await userApp.get('/v1/appointments');
    expect(getResult).toHaveSucceeded();
    expect(getResult.body.count).toEqual(1);
    expect(getResult.body.data[0].status).toEqual(APPOINTMENT_STATUSES.CANCELLED);
  });
});
