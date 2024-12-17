import { createDummyPatient } from '@tamanu/shared/demoData/patients';
import { add } from 'date-fns';
import { APPOINTMENT_STATUSES, REPEAT_FREQUENCY } from '@tamanu/constants';
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
    const result = await userApp.post('/api/appointments').send({
      patientId: patient.id,
      startTime: add(new Date(), { days: 1 }), // create a date in the future
      clinicianId: userApp.user.dataValues.id,
      appointmentTypeId: 'appointmentType-standard',
    });
    appointment = result.body;
    expect(result).toHaveSucceeded();
    expect(result.body.appointmentTypeId).toEqual('appointmentType-standard');
    expect(result.body.patientId).toEqual(patient.id);
    expect(result.body.status).toEqual(APPOINTMENT_STATUSES.CONFIRMED);
    expect(result.body.clinicianId).toEqual(userApp.user.dataValues.id);
  });
  it('should list appointments', async () => {
    const result = await userApp.get('/api/appointments');
    expect(result).toHaveSucceeded();
    expect(result.body.count).toEqual(1);
    // verify that the appointment returned is the one created above
    expect(result.body.data[0].id).toEqual(appointment.id);
  });
  it('should cancel an appointment', async () => {
    const result = await userApp.put(`/api/appointments/${appointment.id}`).send({
      status: APPOINTMENT_STATUSES.CANCELLED,
    });
    expect(result).toHaveSucceeded();
    expect(result.body.status).toEqual(APPOINTMENT_STATUSES.CANCELLED);
    const getResult = await userApp.get('/api/appointments?includeCancelled=true');
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

  describe('Generate repeating appointments', () => {
    const testRepeatingAppointment = async (appointmentSchedule, expected) => {
      const result = await userApp.post('/api/appointments').send({
        appointmentSchedule,
        patientId: patient.id,
        clinicianId: userApp.user.dataValues.id,
        startTime: appointmentSchedule.startDate,
        appointmentTypeId: 'appointmentType-standard',
      });
      expect(result).toHaveSucceeded();
      const appointmentsInSchedule = await models.Appointment.findAll({
        where: { scheduleId: result.body.scheduleId },
        order: [['startTime', 'ASC']],
      });
      expect(appointmentsInSchedule.map(a => a.startTime)).toEqual(expected);
    };
    it('should generate repeating weekly appointments on a wednesday', async () => {
      const appointmentSchedule = {
        startDate: '2024-10-02 12:00:00',
        untilDate: '2025-01-02 23:59:59',
        interval: 1,
        frequency: REPEAT_FREQUENCY.WEEKLY,
        daysOfWeek: ['WE'],
      };
      await testRepeatingAppointment(appointmentSchedule, [
        '2024-10-02 12:00:00',
        '2024-10-09 12:00:00',
        '2024-10-16 12:00:00',
        '2024-10-23 12:00:00',
        '2024-10-30 12:00:00',
        '2024-11-06 12:00:00',
        '2024-11-13 12:00:00',
        '2024-11-20 12:00:00',
        '2024-11-27 12:00:00',
        '2024-12-04 12:00:00',
        '2024-12-11 12:00:00',
        '2024-12-18 12:00:00',
        '2024-12-25 12:00:00',
        '2025-01-01 12:00:00',
      ]);
    });
    it('should generate repeating bi-weekly appointments on a wednesday', async () => {
      const appointmentSchedule = {
        startDate: '2023-09-23 12:00:00',
        untilDate: '2023-12-02 23:59:59',
        interval: 2,
        frequency: REPEAT_FREQUENCY.WEEKLY,
        daysOfWeek: ['WE'],
      };
      await testRepeatingAppointment(appointmentSchedule, [
        '2023-09-23 12:00:00',
        '2023-10-07 12:00:00',
        '2023-10-21 12:00:00',
        '2023-11-04 12:00:00',
        '2023-11-18 12:00:00',
        '2023-12-02 12:00:00',
      ]);
    });
    it('should generate repeating monthly appointments on first tuesday', async () => {
      const appointmentSchedule = {
        startDate: '2024-06-04 12:00:00',
        untilDate: '2024-11-05 23:59:59',
        interval: 1,
        frequency: REPEAT_FREQUENCY.MONTHLY,
        daysOfWeek: ['TU'],
        nthWeekday: 1,
      };
      await testRepeatingAppointment(appointmentSchedule, [
        '2024-06-04 12:00:00',
        '2024-07-02 12:00:00',
        '2024-08-06 12:00:00',
        '2024-09-03 12:00:00',
        '2024-10-01 12:00:00',
        '2024-11-05 12:00:00',
      ]);
    });
    it('should generate repeating bi-monthly appointments on first tuesday', async () => {
      const appointmentSchedule = {
        startDate: '2024-06-04 12:00:00',
        untilDate: '2024-10-01 23:59:59',
        interval: 2,
        frequency: REPEAT_FREQUENCY.MONTHLY,
        daysOfWeek: ['TU'],
        nthWeekday: 1,
      };
      await testRepeatingAppointment(appointmentSchedule, [
        '2024-06-04 12:00:00',
        '2024-08-06 12:00:00',
        '2024-10-01 12:00:00',
      ]);
    });
    it('should generate repeating monthly appointments on last friday', async () => {
      const appointmentSchedule = {
        startDate: '2024-06-28 12:00:00',
        untilDate: '2024-09-27 23:59:59',
        interval: 1,
        frequency: REPEAT_FREQUENCY.MONTHLY,
        daysOfWeek: ['FR'],
        nthWeekday: -1,
      };
      await testRepeatingAppointment(appointmentSchedule, [
        '2024-06-28 12:00:00',
        '2024-07-26 12:00:00',
        '2024-08-30 12:00:00',
        '2024-09-27 12:00:00',
      ]);
    });
  });
});
