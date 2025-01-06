import config from 'config';
import { add } from 'date-fns';

import {
  APPOINTMENT_STATUSES,
  PATIENT_COMMUNICATION_CHANNELS,
  PATIENT_COMMUNICATION_TYPES,
  SETTINGS_SCOPES,
} from '@tamanu/constants';
import { createDummyPatient } from '@tamanu/shared/demoData/patients';
import { randomRecordId } from '@tamanu/shared/demoData/utilities';
import { fake } from '@tamanu/shared/test-helpers/fake';
import { selectFacilityIds } from '@tamanu/shared/utils/configSelectors';

import { createTestContext } from '../utilities';

describe('Appointments', () => {
  const [facilityId] = selectFacilityIds(config);
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
    expect(result.body.status).toEqual(APPOINTMENT_STATUSES.CANCELLED);
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

      it('should use template from settings for email subject and body', async () => {
        const TEST_SUBJECT = 'test subject';
        const TEST_CONTENT = 'test body';

        await models.Setting.set(
          'templates.appointmentConfirmation',
          {
            subject: TEST_SUBJECT,
            body: TEST_CONTENT,
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
        expect(patientCommunication.subject).toBe(TEST_SUBJECT);
        expect(patientCommunication.content).toBe(TEST_CONTENT);
      });
    });
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
});
