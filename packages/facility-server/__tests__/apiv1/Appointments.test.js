import { createDummyPatient } from '@tamanu/shared/demoData/patients';
import { add } from 'date-fns';
import {
  APPOINTMENT_STATUSES,
  PATIENT_COMMUNICATION_CHANNELS,
  PATIENT_COMMUNICATION_TYPES,
  SETTINGS_SCOPES,
} from '@tamanu/constants';
import { randomRecordId } from '@tamanu/shared/demoData/utilities';
import { createTestContext } from '../utilities';
import { fake } from '@tamanu/shared/test-helpers/fake';
import config from 'config';
import { selectFacilityIds } from '@tamanu/shared/utils/configSelectors';

describe('Appointments', () => {
  let baseApp;
  let models;
  let userApp;
  let patient;
  let appointment;
  let ctx;
  const [facilityId] = selectFacilityIds(config);

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    userApp = await baseApp.asRole('practitioner');
    patient = await models.Patient.create(await createDummyPatient(models));
  });
  afterAll(() => ctx.close());
  it('should create a new outpatient appointment', async () => {
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

  describe('outpatient appointments', () => {
    describe('reminder emails', () => {
      const TEST_EMAIL = 'test@email.com';
      it('should create patient communication record when created with email in request body', async () => {
        const appointmentWithEmail = await userApp.post('/api/appointments').send({
          patientId: patient.id,
          startTime: add(new Date(), { days: 1 }),
          clinicianId: userApp.user.dataValues.id,
          appointmentTypeId: 'appointmentType-standard',
          email: TEST_EMAIL,
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
        const newAppointment = await models.Appointment.create({
          ...fake(models.Appointment),
          patientId: patient.id,
        });
        const result1 = await userApp
          .post('/api/appointments/emailReminder')
          .send({ facilityId, appointmentId: newAppointment.id, email: TEST_EMAIL });
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

        const newAppointment = await models.Appointment.create({
          ...fake(models.Appointment),
          patientId: patient.id,
        });
        await userApp
          .post('/api/appointments/emailReminder')
          .send({ facilityId, appointmentId: newAppointment.id, email: TEST_EMAIL });
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
    it.todo('patientname or id filter');
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
