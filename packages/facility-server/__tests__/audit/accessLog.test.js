import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import config from 'config';
import { fake } from '@tamanu/fake-data/fake';
import { settingsCache } from '@tamanu/settings';
import { getCurrentPrimaryTimeZoneDateString } from '@tamanu/shared/utils/primaryDateTime';
import { createTestContext } from '../utilities';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { version } from '../../package.json';
import { APPOINTMENT_STATUSES, SETTINGS_SCOPES } from '@tamanu/constants';

describe('AccessLog', () => {
  const [facilityId] = selectFacilityIds(config);
  let baseApp;
  let models;
  let userApp;
  let patient;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    userApp = await baseApp.asRole('practitioner');

    await models.Setting.set('audit.accesses.enabled', true, SETTINGS_SCOPES.GLOBAL);
  });

  beforeEach(async () => {
    // Clean up access logs before each test
    await models.AccessLog.truncate({ cascade: true });
    // Create a fresh patient for each test
    patient = await models.Patient.create(fake(models.Patient));
  });

  afterAll(() => ctx.close());

  describe('GET /api/patient/:id', () => {
    it('should create an AccessLog with appropriate details when accessing a patient', async () => {
      const endpoint = `/api/patient/${patient.id}`;

      const response = await userApp.get(endpoint);
      expect(response).toHaveSucceeded();

      const accessLogs = await models.AccessLog.findAll();
      expect(accessLogs.length).toBe(1);
      const log = accessLogs[0];
      expect(log).toMatchObject({
        frontEndContext: { id: patient.id },
        backEndContext: { endpoint },
        userId: userApp.user.id,
        recordId: patient.id,
        recordType: 'Patient',
        facilityId,
        isMobile: false,
        version,
        sessionId: expect.any(String),
      });
    });

    it('should not create an AccessLog when the request fails', async () => {
      const endpoint = `/api/patient/invalid-id`;

      const response = await userApp.get(endpoint);
      expect(response).toHaveRequestError();

      const accessLogs = await models.AccessLog.findAll();
      expect(accessLogs.length).toBe(0);
    });
  });

  // spec: KIOSK — the tablet is signed in with a staff account, so the audit trail is what
  // answers for the patient records the kiosk puts on screen
  describe('GET /api/kiosk/appointments', () => {
    let locationGroup;

    beforeAll(async () => {
      await models.Setting.set('kiosk', { enabled: true }, SETTINGS_SCOPES.FACILITY, facilityId);
      settingsCache.reset();
      locationGroup = await models.LocationGroup.create(fake(models.LocationGroup, { facilityId }));
    });

    const createKioskAppointment = (kioskPatient, startTime = '10:30:00') => {
      const today = getCurrentPrimaryTimeZoneDateString();
      return models.Appointment.create({
        ...fake(models.Appointment),
        patientId: kioskPatient.id,
        clinicianId: userApp.user.id,
        locationGroupId: locationGroup.id,
        startTime: `${today} ${startTime}`,
        endTime: `${today} 23:00:00`,
        status: APPOINTMENT_STATUSES.CONFIRMED,
      });
    };

    const expectOnePatientAccessLog = async recordId => {
      const accessLogs = await models.AccessLog.findAll();
      expect(accessLogs).toHaveLength(1);
      expect(accessLogs[0]).toMatchObject({
        userId: userApp.user.id,
        recordId,
        recordType: 'Patient',
        facilityId,
      });
    };

    it('records a patient with two appointments today once', async () => {
      const kioskPatient = await models.Patient.create(
        fake(models.Patient, { lastName: 'Fifita', dateOfBirth: '1979-08-02' }),
      );
      await createKioskAppointment(kioskPatient, '09:00:00');
      await createKioskAppointment(kioskPatient, '14:00:00');

      const response = await userApp
        .get('/api/kiosk/appointments')
        .query({ lastName: 'Fifita', dateOfBirth: '1979-08-02' });
      expect(response).toHaveSucceeded();
      expect(response.body.data).toHaveLength(2);

      await expectOnePatientAccessLog(kioskPatient.id);
    });

    it('records the patient whose forms the kiosk loads', async () => {
      const appointment = await createKioskAppointment(patient);

      const response = await userApp.get(`/api/kiosk/appointments/${appointment.id}`);
      expect(response).toHaveSucceeded();

      await expectOnePatientAccessLog(patient.id);
    });

    it('records the patient who checks in', async () => {
      const appointment = await createKioskAppointment(patient);

      const response = await userApp
        .post(`/api/kiosk/appointments/${appointment.id}/checkIn`)
        .send({ responses: [] });
      expect(response).toHaveSucceeded();

      await expectOnePatientAccessLog(patient.id);
    });

    it('records each patient the kiosk search puts on screen', async () => {
      const today = getCurrentPrimaryTimeZoneDateString();
      const kioskPatient = await models.Patient.create(
        fake(models.Patient, { lastName: 'Taufa', dateOfBirth: '1986-03-14' }),
      );
      const locationGroup = await models.LocationGroup.create(
        fake(models.LocationGroup, { facilityId }),
      );
      await models.Appointment.create({
        ...fake(models.Appointment),
        patientId: kioskPatient.id,
        clinicianId: userApp.user.id,
        locationGroupId: locationGroup.id,
        startTime: `${today} 10:30:00`,
        endTime: `${today} 11:00:00`,
        status: APPOINTMENT_STATUSES.CONFIRMED,
      });

      const response = await userApp
        .get('/api/kiosk/appointments')
        .query({ lastName: 'Taufa', dateOfBirth: '1986-03-14' });
      expect(response).toHaveSucceeded();
      expect(response.body.data).toHaveLength(1);

      const accessLogs = await models.AccessLog.findAll();
      expect(accessLogs.length).toBe(1);
      expect(accessLogs[0]).toMatchObject({
        userId: userApp.user.id,
        recordId: kioskPatient.id,
        recordType: 'Patient',
        facilityId,
      });
    });

    it('records nothing when no patient is found', async () => {
      const response = await userApp
        .get('/api/kiosk/appointments')
        .query({ lastName: 'Nobody', dateOfBirth: '1986-03-14' });
      expect(response).toHaveSucceeded();

      expect(await models.AccessLog.findAll()).toHaveLength(0);
    });
  });
});
