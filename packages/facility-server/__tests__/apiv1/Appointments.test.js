import config from 'config';
import { add } from 'date-fns';
import { Op } from 'sequelize';

import { createDummyPatient } from '@tamanu/database/demoData/patients';
import { randomRecordId } from '@tamanu/database/demoData/utilities';
import {
  APPOINTMENT_STATUSES,
  REPEAT_FREQUENCY,
  MODIFY_REPEATING_APPOINTMENT_MODE,
} from '@tamanu/constants';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

import { createTestContext } from '../utilities';

describe('Appointments', () => {
  const [facilityId] = selectFacilityIds(config);
  let baseApp;
  let models;
  let userApp;
  let patient;
  let appointment;
  let ctx;
  let maxRepeatingAppointmentsPerGeneration;

  beforeAll(async () => {
    ctx = await createTestContext();
    maxRepeatingAppointmentsPerGeneration = await ctx.settings[facilityId].get(
      'appointments.maxRepeatingAppointmentsPerGeneration',
    );
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
      it('should reject if it would contain an existing booking within it', async () => {
        const result = await makeBooking('2024-10-02 11:30:00', '2024-10-02 13:00:00');
        expect(result.status).toBe(409);
      });
      it('should reject if it would be contained within an existing booking', async () => {
        const result = await makeBooking('2024-10-02 12:10:00', '2024-10-02 12:20:00');
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

  describe('validation', () => {
    it('should reject an appointment without an untilDate or occurrenceCount', async () => {
      await expect(
        models.AppointmentSchedule.create({
          interval: 1,
          frequency: REPEAT_FREQUENCY.WEEKLY,
          daysOfWeek: ['WE'],
        }),
      ).rejects.toThrow(
        'Validation error: AppointmentSchedule must have either untilDate or occurrenceCount',
      );
    });
    it('should reject an appointment without exactly one weekday', async () => {
      await expect(
        models.AppointmentSchedule.create({
          untilDate: '2024-10-10',
          interval: 1,
          frequency: REPEAT_FREQUENCY.WEEKLY,
          daysOfWeek: ['WE', 'TH'],
        }),
      ).rejects.toThrow('Validation error: AppointmentSchedule must have exactly one weekday');
    });
    it('should reject an appointment without nthWeekday for MONTHLY frequency', async () => {
      await expect(
        models.AppointmentSchedule.create({
          untilDate: '2024-10-10',
          interval: 1,
          frequency: REPEAT_FREQUENCY.MONTHLY,
          daysOfWeek: ['WE'],
        }),
      ).rejects.toThrow(
        'Validation error: AppointmentSchedule must have nthWeekday for MONTHLY frequency',
      );
    });
  });

  describe('create with schedule', () => {
    const testRepeatingAppointment = async (schedule, startTime, expected) => {
      const result = await userApp.post('/api/appointments').send({
        schedule,
        patientId: patient.id,
        clinicianId: userApp.user.dataValues.id,
        appointmentTypeId: 'appointmentType-standard',
        startTime,
        facilityId,
      });
      expect(result).toHaveSucceeded();
      const appointmentsInSchedule = await models.Appointment.findAll({
        where: { scheduleId: result.body.scheduleId },
        order: [['startTime', 'ASC']],
      });
      if (!expected) return appointmentsInSchedule;
      expect(appointmentsInSchedule.map((a) => a.startTime)).toEqual(expected);
    };
    it('should generate repeating weekly appointments on Wednesday', async () => {
      const appointmentSchedule = {
        untilDate: '2024-12-04',
        interval: 1,
        frequency: REPEAT_FREQUENCY.WEEKLY,
        daysOfWeek: ['WE'],
      };
      await testRepeatingAppointment(appointmentSchedule, '2024-10-02 12:00:00', [
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
      ]);
    });
    it('should generate repeating weekly appointments on Friday to occurrence count', async () => {
      const appointmentSchedule = {
        occurrenceCount: 5,
        interval: 1,
        frequency: REPEAT_FREQUENCY.WEEKLY,
        daysOfWeek: ['FR'],
      };
      await testRepeatingAppointment(appointmentSchedule, '2024-10-04 12:00:00', [
        '2024-10-04 12:00:00',
        '2024-10-11 12:00:00',
        '2024-10-18 12:00:00',
        '2024-10-25 12:00:00',
        '2024-11-01 12:00:00',
      ]);
    });
    it('should generate repeating bi-weekly appointments on Wednesday', async () => {
      const appointmentSchedule = {
        untilDate: '2023-12-02',
        interval: 2,
        frequency: REPEAT_FREQUENCY.WEEKLY,
        daysOfWeek: ['WE'],
      };
      await testRepeatingAppointment(appointmentSchedule, '2023-09-23 12:00:00', [
        '2023-09-23 12:00:00',
        '2023-10-07 12:00:00',
        '2023-10-21 12:00:00',
        '2023-11-04 12:00:00',
        '2023-11-18 12:00:00',
        '2023-12-02 12:00:00',
      ]);
    });
    it('should generate repeating monthly appointments on first Tuesday', async () => {
      const appointmentSchedule = {
        untilDate: '2024-11-05',
        interval: 1,
        frequency: REPEAT_FREQUENCY.MONTHLY,
        daysOfWeek: ['TU'],
        nthWeekday: 1,
      };
      await testRepeatingAppointment(appointmentSchedule, '2024-06-04 12:00:00', [
        '2024-06-04 12:00:00',
        '2024-07-02 12:00:00',
        '2024-08-06 12:00:00',
        '2024-09-03 12:00:00',
        '2024-10-01 12:00:00',
        '2024-11-05 12:00:00',
      ]);
    });
    it('should generate repeating monthly appointments on second Wednesday to occurrence count', async () => {
      const appointmentSchedule = {
        occurrenceCount: 3,
        interval: 1,
        frequency: REPEAT_FREQUENCY.MONTHLY,
        daysOfWeek: ['WE'],
        nthWeekday: 2,
      };
      await testRepeatingAppointment(appointmentSchedule, '2024-06-12 12:00:00', [
        '2024-06-12 12:00:00',
        '2024-07-10 12:00:00',
        '2024-08-14 12:00:00',
      ]);
    });
    it('should generate repeating monthly appointments on last friday', async () => {
      const appointmentSchedule = {
        startDate: '2024-06-28 12:00:00',
        untilDate: '2024-09-27',
        interval: 1,
        frequency: REPEAT_FREQUENCY.MONTHLY,
        daysOfWeek: ['FR'],
        nthWeekday: -1,
      };
      await testRepeatingAppointment(appointmentSchedule, '2024-06-28 12:00:00', [
        '2024-06-28 12:00:00',
        '2024-07-26 12:00:00',
        '2024-08-30 12:00:00',
        '2024-09-27 12:00:00',
      ]);
    });
    it('should generate repeating bi-monthly appointments on first tuesday', async () => {
      const appointmentSchedule = {
        untilDate: '2024-10-01',
        interval: 2,
        frequency: REPEAT_FREQUENCY.MONTHLY,
        daysOfWeek: ['TU'],
        nthWeekday: 1,
      };
      await testRepeatingAppointment(appointmentSchedule, '2024-06-04 12:00:00', [
        '2024-06-04 12:00:00',
        '2024-08-06 12:00:00',
        '2024-10-01 12:00:00',
      ]);
    });
    it('should only generate the maximum number of weekly appointments', async () => {
      const appointmentSchedule = {
        occurrenceCount: maxRepeatingAppointmentsPerGeneration + 10,
        interval: 1,
        frequency: REPEAT_FREQUENCY.WEEKLY,
        daysOfWeek: ['TU'],
      };
      const result = await testRepeatingAppointment(appointmentSchedule, '2024-06-04 12:00:00');
      expect(result).toHaveLength(maxRepeatingAppointmentsPerGeneration);
    });
    it('should only generate the maximum number of monthly appointments', async () => {
      const appointmentSchedule = {
        occurrenceCount: maxRepeatingAppointmentsPerGeneration + 10,
        interval: 1,
        frequency: REPEAT_FREQUENCY.MONTHLY,
        daysOfWeek: ['TU'],
        nthWeekday: 1,
      };
      const result = await testRepeatingAppointment(appointmentSchedule, '2024-06-04 12:00:00');
      expect(result).toHaveLength(maxRepeatingAppointmentsPerGeneration);
    });
  });
  describe('modify with schedule', () => {
    const scheduleCreateData = {
      untilDate: '2024-10-23',
      interval: 1,
      frequency: REPEAT_FREQUENCY.WEEKLY,
      daysOfWeek: ['WE'],
      occurrenceCount: null,
      nthWeekday: null,
    };
    const generateSchedule = async () => {
      const schedule = await models.AppointmentSchedule.create(scheduleCreateData);
      const appointments = await models.Appointment.bulkCreate(
        [
          '2024-10-02 12:00:00',
          '2024-10-09 12:00:00',
          '2024-10-16 12:00:00',
          '2024-10-23 12:00:00',
        ].map((startTime) => ({
          patientId: patient.id,
          startTime,
          clinicianId: userApp.user.dataValues.id,
          appointmentTypeId: 'appointmentType-standard',
          scheduleId: schedule.id,
        })),
      );
      return [schedule, appointments];
    };

    it('should update all future appointments if schedule is unchanged and updating a mid schedule appointment', async () => {
      const [schedule, appointments] = await generateSchedule();
      const thirdAppointment = appointments[2];

      await userApp.put(`/api/appointments/${thirdAppointment.id}`).send({
        startTime: '2024-10-16 12:00:00',
        appointmentTypeId: 'appointmentType-specialist',
        facilityId,
        modifyRepeatingMode: MODIFY_REPEATING_APPOINTMENT_MODE.THIS_AND_FUTURE_APPOINTMENTS,
      });
      const appointmentsInSchedule = await schedule.getAppointments({
        order: [['startTime', 'ASC']],
      });

      // 3rd and 4th appointments should be updated
      expect(appointmentsInSchedule.map((a) => a.appointmentTypeId)).toEqual([
        'appointmentType-standard',
        'appointmentType-standard',
        'appointmentType-specialist',
        'appointmentType-specialist',
      ]);
    });
    it('should update all appointments if schedule is unchanged and updating first appointment', async () => {
      const [schedule, appointments] = await generateSchedule();
      const firstAppointment = appointments[0];

      await userApp.put(`/api/appointments/${firstAppointment.id}`).send({
        startTime: '2024-10-02 12:00:00',
        appointmentTypeId: 'appointmentType-specialist',
        facilityId,
        modifyRepeatingMode: MODIFY_REPEATING_APPOINTMENT_MODE.THIS_AND_FUTURE_APPOINTMENTS,
      });
      const appointmentsInSchedule = await schedule.getAppointments({
        order: [['startTime', 'ASC']],
      });

      // All appointments should be updated
      expect(
        appointmentsInSchedule.every((a) => a.appointmentTypeId === 'appointmentType-specialist'),
      ).toBeTruthy();
    });
    it('should create a new schedule and close existing one if schedule data is supplied when updating a mid schedule appointment', async () => {
      const [schedule, appointments] = await generateSchedule();
      const thirdAppointment = appointments[2];

      const result = await userApp.put(`/api/appointments/${thirdAppointment.id}`).send({
        schedule: {
          untilDate: '2024-10-30',
          interval: 1,
          frequency: REPEAT_FREQUENCY.WEEKLY,
          daysOfWeek: ['WE'],
          occurrenceCount: null,
          nthWeekday: null,
        },
        startTime: '2024-10-16 12:00:00',
        appointmentTypeId: 'appointmentType-specialist',
        facilityId,
        id: thirdAppointment.id,
        modifyRepeatingMode: MODIFY_REPEATING_APPOINTMENT_MODE.THIS_AND_FUTURE_APPOINTMENTS,
      });

      expect(result).toHaveSucceeded();
      expect(result.body.schedule).toBeTruthy();

      const updatedExistingSchedule = await models.AppointmentSchedule.findOne({
        where: {
          id: schedule.id,
        },
        include: [
          {
            model: models.Appointment,
            as: 'appointments',
            where: {
              status: {
                [Op.not]: APPOINTMENT_STATUSES.CANCELLED,
              },
            },
          },
        ],
      });

      expect(updatedExistingSchedule.untilDate).toEqual('2024-10-09');
      expect(updatedExistingSchedule.appointments.map((a) => a.startTime)).toEqual([
        '2024-10-02 12:00:00',
        '2024-10-09 12:00:00',
      ]);
      expect(
        updatedExistingSchedule.appointments.every(
          (a) => a.appointmentTypeId === 'appointmentType-standard',
        ),
      ).toBeTruthy();

      const newSchedule = await models.AppointmentSchedule.findOne({
        where: {
          id: result.body.schedule.id,
        },
        include: [
          {
            model: models.Appointment,
            as: 'appointments',
          },
        ],
      });

      expect(newSchedule.appointments.map((a) => a.startTime)).toEqual([
        '2024-10-16 12:00:00',
        '2024-10-23 12:00:00',
        '2024-10-30 12:00:00',
      ]);
      expect(
        newSchedule.appointments.every((a) => a.appointmentTypeId === 'appointmentType-specialist'),
      ).toBeTruthy();
    });

    it('should create a new schedule and close existing one if schedule data is supplied when updating the first appointment in schedule', async () => {
      const [schedule, appointments] = await generateSchedule();
      const firstAppointment = appointments[0];

      const result = await userApp.put(`/api/appointments/${firstAppointment.id}`).send({
        schedule: {
          untilDate: '2024-10-23',
          interval: 2,
          frequency: REPEAT_FREQUENCY.WEEKLY,
          daysOfWeek: ['WE'],
          occurrenceCount: null,
          nthWeekday: null,
        },
        startTime: '2024-10-02 12:00:00',
        appointmentTypeId: 'appointmentType-specialist',
        facilityId,
        id: firstAppointment.id,
        modifyRepeatingMode: MODIFY_REPEATING_APPOINTMENT_MODE.THIS_AND_FUTURE_APPOINTMENTS,
      });

      expect(result).toHaveSucceeded();
      expect(result.body.schedule).toBeTruthy();

      const updatedExistingSchedule = await models.AppointmentSchedule.findOne({
        where: {
          id: schedule.id,
        },
        include: [
          {
            model: models.Appointment,
            as: 'appointments',
            required: false,
            where: {
              status: {
                [Op.not]: APPOINTMENT_STATUSES.CANCELLED,
              },
            },
          },
        ],
      });

      expect(updatedExistingSchedule.untilDate).toEqual('2024-10-02');
      expect(updatedExistingSchedule.appointments).toHaveLength(0);

      const newSchedule = await models.AppointmentSchedule.findOne({
        where: {
          id: result.body.schedule.id,
        },
        include: [
          {
            model: models.Appointment,
            as: 'appointments',
          },
        ],
      });

      expect(newSchedule.appointments.map((a) => a.startTime)).toEqual([
        '2024-10-02 12:00:00',
        '2024-10-16 12:00:00',
      ]);
      expect(
        newSchedule.appointments.every((a) => a.appointmentTypeId === 'appointmentType-specialist'),
      ).toBeTruthy();
    });
  });
  describe('delete with schedule', () => {
    const scheduleCreateData = {
      untilDate: '2024-10-23',
      interval: 1,
      frequency: REPEAT_FREQUENCY.WEEKLY,
      daysOfWeek: ['WE'],
      occurrenceCount: null,
      nthWeekday: null,
    };
    const generateSchedule = async () => {
      const schedule = await models.AppointmentSchedule.create(scheduleCreateData);
      const appointments = await models.Appointment.bulkCreate(
        [
          '2024-10-02 12:00:00',
          '2024-10-09 12:00:00',
          '2024-10-16 12:00:00',
          '2024-10-23 12:00:00',
        ].map((startTime) => ({
          patientId: patient.id,
          startTime,
          clinicianId: userApp.user.dataValues.id,
          appointmentTypeId: 'appointmentType-standard',
          scheduleId: schedule.id,
        })),
      );
      return [schedule, appointments];
    };
    it('should delete this and all future appointments if "this and future appointments on"', async () => {
      const [schedule, appointments] = await generateSchedule();
      const thirdAppointment = appointments[2];

      await userApp.put(`/api/appointments/${thirdAppointment.id}`).send({
        status: APPOINTMENT_STATUSES.CANCELLED,
        facilityId,
        modifyRepeatingMode: MODIFY_REPEATING_APPOINTMENT_MODE.THIS_AND_FUTURE_APPOINTMENTS,
      });
      const appointmentsInSchedule = await schedule.getAppointments({
        order: [['startTime', 'ASC']],
      });

      // 3rd and 4th appointments should be cancelled
      expect(appointmentsInSchedule.map((a) => a.status)).toEqual([
        APPOINTMENT_STATUSES.CONFIRMED,
        APPOINTMENT_STATUSES.CONFIRMED,
        APPOINTMENT_STATUSES.CANCELLED,
        APPOINTMENT_STATUSES.CANCELLED,
      ]);

      // TODO: Resolve the schedule
    });
    it('should delete just the selected appointment if "this appointment" selected', async () => {
      const [schedule, appointments] = await generateSchedule();
      const thirdAppointment = appointments[2];

      await userApp.put(`/api/appointments/${thirdAppointment.id}`).send({
        status: APPOINTMENT_STATUSES.CANCELLED,
        facilityId,
        modifyRepeatingMode: MODIFY_REPEATING_APPOINTMENT_MODE.THIS_APPOINTMENT,
      });
      const appointmentsInSchedule = await schedule.getAppointments({
        order: [['startTime', 'ASC']],
      });

      // 3rd appointment should be cancelled
      expect(appointmentsInSchedule.map((a) => a.status)).toEqual([
        APPOINTMENT_STATUSES.CONFIRMED,
        APPOINTMENT_STATUSES.CONFIRMED,
        APPOINTMENT_STATUSES.CANCELLED,
        APPOINTMENT_STATUSES.CONFIRMED,
      ]);
    });
  });
});
