import config from 'config';
import { add, format } from 'date-fns';
import { Op } from 'sequelize';

import {
  APPOINTMENT_STATUSES,
  PATIENT_COMMUNICATION_CHANNELS,
  PATIENT_COMMUNICATION_TYPES,
  SETTINGS_SCOPES,
  REPEAT_FREQUENCY,
  MODIFY_REPEATING_APPOINTMENT_MODE,
} from '@tamanu/constants';
import { replaceInTemplate } from '@tamanu/utils/replaceInTemplate';
import { createDummyPatient } from '@tamanu/database/demoData/patients';
import { randomRecordId } from '@tamanu/database/demoData/utilities';
import { fake } from '@tamanu/fake-data/fake';
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
      facilityId,
    });
    expect(result).toHaveSucceeded();
    appointment = result.body;
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

  it('should return appropriate full/partial matches to displayId or name when passed filter string', async () => {
    appointment = await models.Appointment.create({
      ...fake(models.Appointment),
      patientId: patient.id,
    });

    const searchPatientNameOrId = query =>
      userApp.get(`/api/appointments?patientNameOrId=${query}`);

    // Valid searches
    const searchById = await searchPatientNameOrId(patient.displayId);
    const searchByPartialId = await searchPatientNameOrId(patient.displayId.slice(0, 3));
    const searchByFirstName = await searchPatientNameOrId(patient.firstName);
    const searchByPartialFirstName = await searchPatientNameOrId(patient.firstName.slice(0, 3));
    const searchByLastName = await searchPatientNameOrId(patient.lastName);
    const searchByPartialLastName = await searchPatientNameOrId(patient.lastName.slice(0, 3));
    expect(searchById.body.count).toBe(1);
    expect(searchByPartialId.body.count).toBe(1);
    expect(searchByFirstName.body.count).toBe(1);
    expect(searchByPartialFirstName.body.count).toBe(1);
    expect(searchByLastName.body.count).toBe(1);
    expect(searchByPartialLastName.body.count).toBe(1);

    // Invalid searches
    const searchByInvalidString = await searchPatientNameOrId('invalid');
    expect(searchByInvalidString.body.count).toBe(0);
  });

  describe('outpatient appointments', () => {
    describe('reminder emails', () => {
      const TEST_EMAIL = 'test@email.com';
      beforeAll(async () => {
        appointment = await models.Appointment.create({
          ...fake(models.Appointment),
          patientId: patient.id,
          clinicianId: userApp.user.dataValues.id,
          locationGroupId: await randomRecordId(models, 'LocationGroup'),
        });
      });
      afterEach(async () => {
        await models.PatientCommunication.truncate({ cascade: true, force: true });
      });

      it('should create patient communication record when created with email in request body', async () => {
        const appointmentWithEmail = await userApp.post('/api/appointments').send({
          patientId: patient.id,
          startTime: add(new Date(), { days: 1 }),
          clinicianId: userApp.user.dataValues.id,
          appointmentTypeId: 'appointmentType-standard',
          email: TEST_EMAIL,
          locationGroupId: await randomRecordId(models, 'LocationGroup'),
          facilityId,
        });
        expect(appointmentWithEmail).toHaveSucceeded();

        const patientCommunications = await models.PatientCommunication.findAll();
        expect(patientCommunications.length).toBe(1);
        expect(patientCommunications[0]).toMatchObject({
          type: PATIENT_COMMUNICATION_TYPES.APPOINTMENT_CONFIRMATION,
          channel: PATIENT_COMMUNICATION_CHANNELS.EMAIL,
          destination: TEST_EMAIL,
        });
      });

      it('should create patient communication record when hitting email endpoint', async () => {
        const result1 = await userApp
          .post('/api/appointments/emailReminder')
          .send({ facilityId, appointmentId: appointment.id, email: TEST_EMAIL });
        expect(result1).toHaveSucceeded();
        const patientCommunications = await models.PatientCommunication.findAll();
        expect(patientCommunications.length).toBe(1);
        expect(patientCommunications[0]).toMatchObject({
          type: PATIENT_COMMUNICATION_TYPES.APPOINTMENT_CONFIRMATION,
          channel: PATIENT_COMMUNICATION_CHANNELS.EMAIL,
          destination: TEST_EMAIL,
        });
      });

      it('should apply template replacements when sending outpatient reminder email', async () => {
        const template = await ctx.settings[facilityId].get(
          'templates.appointmentConfirmation.outpatientAppointment',
        );

        const appointmentForEmail = await models.Appointment.findByPk(appointment.id, {
          include: ['patient', 'clinician', 'locationGroup'],
        });

        const facility = await models.Facility.findByPk(facilityId);

        await userApp
          .post('/api/appointments/emailReminder')
          .send({ facilityId, appointmentId: appointment.id, email: TEST_EMAIL });

        const patientCommunication = await models.PatientCommunication.findOne({
          where: {
            destination: TEST_EMAIL,
          },
          raw: true,
        });

        const start = new Date(appointmentForEmail.startTime);
        const expectedContent = replaceInTemplate(template.body, {
          firstName: appointmentForEmail.patient.firstName,
          lastName: appointmentForEmail.patient.lastName,
          facilityName: facility.name,
          startDate: format(start, 'PPPP'),
          startTime: format(start, 'p'),
          locationName: appointmentForEmail.locationGroup.name,
          clinicianName: `\nClinician: ${appointmentForEmail.clinician.displayName}`,
        });

        expect(patientCommunication.subject).toBe(template.subject);
        expect(patientCommunication.content).toBe(expectedContent);
      });

      it('should use overridden outpatient template when settings are updated', async () => {
        const OVERRIDE_SUBJECT = 'override outpatient subject';
        const OVERRIDE_BODY = 'override outpatient body';

        await models.Setting.set(
          'templates.appointmentConfirmation.outpatientAppointment',
          {
            subject: OVERRIDE_SUBJECT,
            body: OVERRIDE_BODY,
          },
          SETTINGS_SCOPES.GLOBAL,
        );

        await userApp
          .post('/api/appointments/emailReminder')
          .send({ facilityId, appointmentId: appointment.id, email: TEST_EMAIL });

        const patientCommunication = await models.PatientCommunication.findOne({
          where: {
            destination: TEST_EMAIL,
          },
          raw: true,
        });

        expect(patientCommunication.subject).toBe(OVERRIDE_SUBJECT);
        expect(patientCommunication.content).toBe(OVERRIDE_BODY);
      });
    });
  });

  describe('location bookings', () => {
    let locationId, patientId, clinicianId;

    beforeAll(async () => {
      const locationGroup = await models.LocationGroup.create(
        fake(models.LocationGroup, { facilityId }),
      );
      const location = await models.Location.create(
        fake(models.Location, { locationGroupId: locationGroup.id, facilityId }),
      );
      locationId = location.id;
      patientId = patient.id;
      clinicianId = userApp.user.dataValues.id;
    });

    const makeBooking = async (startTime, endTime, email) =>
      userApp.post('/api/appointments/locationBooking').send({
        patientId,
        startTime,
        endTime,
        clinicianId,
        locationId,
        facilityId,
        email,
      });

    describe('booked time conflict checking', () => {
      beforeEach(async () => {
        await makeBooking('2024-10-02 12:00:00', '2024-10-02 12:30:00');
      });

      afterEach(async () => {
        await models.Appointment.truncate();
      });

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

    describe('booking confirmation emails', () => {
      const TEST_EMAIL = 'booking@test.com';

      afterEach(async () => {
        await models.PatientCommunication.truncate({ cascade: true, force: true });
      });

      it('should create patient communication record when created with email in request body', async () => {
        const result = await makeBooking('2024-10-03 12:00:00', '2024-10-03 12:30:00', TEST_EMAIL);
        expect(result).toHaveSucceeded();

        const patientCommunications = await models.PatientCommunication.findAll();
        expect(patientCommunications.length).toBe(1);
        expect(patientCommunications[0]).toMatchObject({
          type: PATIENT_COMMUNICATION_TYPES.BOOKING_CONFIRMATION,
          channel: PATIENT_COMMUNICATION_CHANNELS.EMAIL,
          destination: TEST_EMAIL,
        });
      });

      it('should apply template replacements when sending location booking confirmation email', async () => {
        const template = await ctx.settings[facilityId].get(
          'templates.appointmentConfirmation.locationBooking',
        );

        const result = await makeBooking('2024-10-04 12:00:00', '2024-10-04 12:30:00', TEST_EMAIL);

        expect(result).toHaveSucceeded();

        const createdAppointmentId = result.body.id;

        const appointmentForEmail = await models.Appointment.findByPk(createdAppointmentId, {
          include: [
            'patient',
            'clinician',
            {
              association: 'location',
              include: ['locationGroup'],
            },
          ],
        });

        const facility = await models.Facility.findByPk(facilityId);

        const patientCommunication = await models.PatientCommunication.findOne({
          where: {
            destination: TEST_EMAIL,
          },
          raw: true,
        });

        const start = new Date(appointmentForEmail.startTime);
        const expectedContent = replaceInTemplate(template.body, {
          firstName: appointmentForEmail.patient.firstName,
          lastName: appointmentForEmail.patient.lastName,
          facilityName: facility.name,
          startDate: format(start, 'PPPP'),
          startTime: format(start, 'p'),
          locationName: appointmentForEmail.location.locationGroup.name,
          clinicianName: `\nClinician: ${appointmentForEmail.clinician.displayName}`,
        });

        expect(patientCommunication.subject).toBe(template.subject);
        expect(patientCommunication.content).toBe(expectedContent);
      });

      it('should use overridden location booking template when settings are updated', async () => {
        const OVERRIDE_SUBJECT = 'override booking subject';
        const OVERRIDE_BODY = 'override booking body';

        await models.Setting.set(
          'templates.appointmentConfirmation.locationBooking',
          {
            subject: OVERRIDE_SUBJECT,
            body: OVERRIDE_BODY,
          },
          SETTINGS_SCOPES.GLOBAL,
        );

        const result = await makeBooking('2024-10-05 12:00:00', '2024-10-05 12:30:00', TEST_EMAIL);

        expect(result).toHaveSucceeded();

        const patientCommunication = await models.PatientCommunication.findOne({
          where: {
            destination: TEST_EMAIL,
          },
          raw: true,
        });

        expect(patientCommunication.subject).toBe(OVERRIDE_SUBJECT);
        expect(patientCommunication.content).toBe(OVERRIDE_BODY);
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
      expect(appointmentsInSchedule.map(a => a.startTime)).toEqual(expected);
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
      untilDate: '2024-10-30',
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
          '2024-10-30 12:00:00',
        ].map(startTime => ({
          patientId: patient.id,
          startTime,
          clinicianId: userApp.user.dataValues.id,
          appointmentTypeId: 'appointmentType-standard',
          scheduleId: schedule.id,
        })),
      );
      return { schedule, appointments };
    };

    it('should update all future appointments if schedule is unchanged and updating a mid schedule appointment', async () => {
      const { schedule, appointments } = await generateSchedule();
      const thirdAppointment = appointments[2];

      await userApp.put(`/api/appointments/${thirdAppointment.id}`).send({
        startTime: '2024-10-16 12:00:00',
        endTime: null,
        appointmentTypeId: 'appointmentType-specialist',
        facilityId,
        modifyMode: MODIFY_REPEATING_APPOINTMENT_MODE.THIS_AND_FUTURE_APPOINTMENTS,
      });
      const appointmentsInSchedule = await schedule.getAppointments({
        order: [['startTime', 'ASC']],
      });

      // 3rd and 4th appointments should be updated
      expect(appointmentsInSchedule.map(a => a.appointmentTypeId)).toEqual([
        'appointmentType-standard',
        'appointmentType-standard',
        'appointmentType-specialist',
        'appointmentType-specialist',
        'appointmentType-specialist',
      ]);
    });

    it('should update all appointments if schedule is unchanged and updating first appointment', async () => {
      const { schedule, appointments } = await generateSchedule();
      const firstAppointment = appointments[0];

      await userApp.put(`/api/appointments/${firstAppointment.id}`).send({
        startTime: '2024-10-02 12:00:00',
        endTime: null,
        appointmentTypeId: 'appointmentType-specialist',
        facilityId,
        modifyMode: MODIFY_REPEATING_APPOINTMENT_MODE.THIS_AND_FUTURE_APPOINTMENTS,
      });
      const appointmentsInSchedule = await schedule.getAppointments({
        order: [['startTime', 'ASC']],
      });

      // All appointments should be updated
      expect(
        appointmentsInSchedule.every(a => a.appointmentTypeId === 'appointmentType-specialist'),
      ).toBeTruthy();
    });

    it('should create a new schedule and close the existing one if schedule data has changed when updating a mid schedule appointment', async () => {
      const { schedule, appointments } = await generateSchedule();
      const thirdAppointment = appointments[2];

      const result = await userApp.put(`/api/appointments/${thirdAppointment.id}`).send({
        schedule: {
          untilDate: '2024-11-06',
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
        modifyMode: MODIFY_REPEATING_APPOINTMENT_MODE.THIS_AND_FUTURE_APPOINTMENTS,
      });

      expect(result).toHaveSucceeded();
      expect(result.body.schedule).toBeTruthy();

      const updatedExistingSchedule = await models.AppointmentSchedule.findByPk(schedule.id);
      const updatedExistingScheduleAppointments = await updatedExistingSchedule.getAppointments({
        where: {
          status: {
            [Op.not]: APPOINTMENT_STATUSES.CANCELLED,
          },
        },
        order: [['startTime', 'ASC']],
      });

      expect(updatedExistingSchedule.cancelledAtDate).toEqual('2024-10-09');
      expect(updatedExistingScheduleAppointments.map(a => a.startTime)).toEqual([
        '2024-10-02 12:00:00',
        '2024-10-09 12:00:00',
      ]);
      expect(
        updatedExistingScheduleAppointments.every(
          a => a.appointmentTypeId === 'appointmentType-standard',
        ),
      ).toBeTruthy();

      const newScheduleAppointments = await models.Appointment.findAll({
        where: { scheduleId: result.body.schedule.id },
        order: [['startTime', 'ASC']],
      });

      expect(newScheduleAppointments.map(a => a.startTime)).toEqual([
        '2024-10-16 12:00:00',
        '2024-10-23 12:00:00',
        '2024-10-30 12:00:00',
        '2024-11-06 12:00:00',
      ]);
      expect(
        newScheduleAppointments.every(a => a.appointmentTypeId === 'appointmentType-specialist'),
      ).toBeTruthy();
    });

    it('should create a new schedule and close the existing one if schedule data has changed when updating the first appointment in schedule', async () => {
      const { schedule, appointments } = await generateSchedule();
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
        modifyMode: MODIFY_REPEATING_APPOINTMENT_MODE.THIS_AND_FUTURE_APPOINTMENTS,
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

      expect(updatedExistingSchedule.cancelledAtDate).toEqual('2024-10-02');
      expect(updatedExistingSchedule.appointments).toHaveLength(0);

      const newScheduleAppointments = await models.Appointment.findAll({
        where: { scheduleId: result.body.schedule.id },
        order: [['startTime', 'ASC']],
      });
      expect(newScheduleAppointments.map(a => a.startTime)).toEqual([
        '2024-10-02 12:00:00',
        '2024-10-16 12:00:00',
      ]);
      expect(
        newScheduleAppointments.every(a => a.appointmentTypeId === 'appointmentType-specialist'),
      ).toBeTruthy();
    });
  });
  describe('delete with schedule', () => {
    const scheduleData = {
      untilDate: '2024-10-23',
      interval: 1,
      frequency: REPEAT_FREQUENCY.WEEKLY,
      daysOfWeek: ['WE'],
      occurrenceCount: null,
      nthWeekday: null,
    };
    const generateSchedule = async () => {
      const schedule = await models.AppointmentSchedule.create(scheduleData);
      const appointments = await models.Appointment.bulkCreate(
        [
          '2024-10-02 12:00:00',
          '2024-10-09 12:00:00',
          '2024-10-16 12:00:00',
          '2024-10-23 12:00:00',
        ].map(startTime => ({
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
        schedule: scheduleData,
        status: APPOINTMENT_STATUSES.CANCELLED,
        facilityId,
        modifyMode: MODIFY_REPEATING_APPOINTMENT_MODE.THIS_AND_FUTURE_APPOINTMENTS,
      });
      const appointmentsInSchedule = await schedule.getAppointments({
        order: [['startTime', 'ASC']],
      });

      // 3rd and 4th appointments should be cancelled
      expect(appointmentsInSchedule.map(a => a.status)).toEqual([
        APPOINTMENT_STATUSES.CONFIRMED,
        APPOINTMENT_STATUSES.CONFIRMED,
        APPOINTMENT_STATUSES.CANCELLED,
        APPOINTMENT_STATUSES.CANCELLED,
      ]);

      const updatedSchedule = await models.AppointmentSchedule.findOne({
        where: {
          id: schedule.id,
        },
      });

      expect(updatedSchedule.cancelledAtDate).toEqual('2024-10-09');
    });
    it('should delete just the selected appointment if "this appointment" selected', async () => {
      const [schedule, appointments] = await generateSchedule();
      const thirdAppointment = appointments[2];

      await userApp.put(`/api/appointments/${thirdAppointment.id}`).send({
        schedule: scheduleData,
        status: APPOINTMENT_STATUSES.CANCELLED,
        facilityId,
        modifyMode: MODIFY_REPEATING_APPOINTMENT_MODE.THIS_APPOINTMENT,
      });
      const appointmentsInSchedule = await schedule.getAppointments({
        order: [['startTime', 'ASC']],
      });

      // 3rd appointment should be cancelled
      expect(appointmentsInSchedule.map(a => a.status)).toEqual([
        APPOINTMENT_STATUSES.CONFIRMED,
        APPOINTMENT_STATUSES.CONFIRMED,
        APPOINTMENT_STATUSES.CANCELLED,
        APPOINTMENT_STATUSES.CONFIRMED,
      ]);
    });
  });
});
