import { createDummyPatient } from '@tamanu/shared/demoData/patients';
import { add } from 'date-fns';
import { APPOINTMENT_STATUSES, APPOINTMENT_TYPES } from '@tamanu/constants';
import { randomRecordId } from '@tamanu/shared/demoData/utilities';
import { createTestContext } from '../utilities';
import { toDateTimeString } from '@tamanu/shared/utils/dateTime';

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
    const result = await userApp.post('/api/appointments').send({
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
    const result = await userApp.get('/api/appointments');
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
    const result = await userApp.get('/api/appointments');
    expect(result.body.data[0].locationGroup.id).toEqual(locationId);
  });
  it('should cancel an appointment', async () => {
    const result = await userApp.put(`/api/appointments/${appointment.id}`).send({
      status: APPOINTMENT_STATUSES.CANCELLED,
    });
    expect(result).toHaveSucceeded();
    expect(result.body.status).toEqual(APPOINTMENT_STATUSES.CANCELLED);
    const getResult = await userApp.get('/api/appointments');
    expect(getResult).toHaveSucceeded();
    expect(getResult.body.count).toEqual(1);
    expect(getResult.body.data[0].status).toEqual(APPOINTMENT_STATUSES.CANCELLED);
  });

  describe('location bookings', () => {
    let locationId, patientId, clinicianId;

    beforeAll(async () => {
      locationId = await randomRecordId(models, 'Location'); // Fetch once for all tests
      patientId = patient.id;
      clinicianId = userApp.user.dataValues.id;
    });

    const makeBooking = async (startTime, endTime) => {
      return await userApp.post('/api/appointments/locationBooking').send({
        patientId,
        startTime,
        endTime,
        clinicianId,
        locationId,
      });
    };

    beforeEach(async () => {
      await makeBooking('2024-10-02 12:00:00', '2024-10-02 12:30:00');
    });

    afterEach(async () => {
      await models.Appointment.truncate();
    });

    describe('booked time conflict checking', () => {
      it('should reject if the same time', async () => {
        const result = await makeBooking('2024-10-02 12:00:00', '2024-10-02 12:30:00');
        expect(result.status).toBe(409);
      });
      it('should reject if start overlaps', async () => {
        const result = await makeBooking('2024-10-02 12:15:00', '2024-10-02 12:45:00');
        expect(result.status).toBe(409);
      });
      it('should reject if end overlaps', async () => {
        const result = await makeBooking('2024-10-02 11:45:00', '2024-10-02 12:15:00');
        expect(result.status).toBe(409);
      });
      it('should reject if completely overlaps', async () => {
        const result = await makeBooking('2024-10-02 11:30:00', '2024-10-02 13:00:00');
        expect(result.status).toBe(409);
      });
      it('should allow booking if start time equals end time of another', async () => {
        const result = await makeBooking('2024-10-02 12:30:00', '2024-10-02 13:00:00');
        expect(result).toHaveSucceeded();
      });
      it('should allow booking if end time equals start time of another', async () => {
        const result = await makeBooking('2024-10-02 11:30:00', '2024-10-02 12:00:00');
        expect(result).toHaveSucceeded();
      });
    });
  });
});
