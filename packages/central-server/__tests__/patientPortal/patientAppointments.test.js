import { VISIBILITY_STATUSES } from '@tamanu/constants/importable';
import { fake } from '@tamanu/fake-data/fake';
import { toDateTimeString } from '@tamanu/utils/dateTime';
import { createTestContext } from '../utilities';
import { getPatientAuthToken } from './patientPortalUtils';

const TEST_PATIENT_EMAIL = 'patient@test.com';

describe('Patient Portal Appointments Endpoints', () => {
  let baseApp;
  let store;
  let close;
  let testPatient;
  let authToken;
  let testVillage;
  let testFacility;
  let testLocationGroup;
  let testExaminer;

  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    close = ctx.close;
    store = ctx.store;
    const { Patient, PortalUser, ReferenceData, Facility, LocationGroup, User, Setting } = store.models;

    await Setting.set('features.patientPortal', true);
    
    // Create a test village
    testVillage = await ReferenceData.create(
      fake(ReferenceData, {
        type: 'village',
        name: 'Test Village',
        code: 'TEST001',
      }),
    );

    // Create a test facility
    testFacility = await Facility.create(
      fake(Facility, {
        name: 'Test Facility',
        code: 'TESTFACILITY',
      }),
    );

    // Create a test location group
    testLocationGroup = await LocationGroup.create(
      fake(LocationGroup, {
        facilityId: testFacility.id,
        name: 'Test Location Group',
        code: 'TESTLOCGROUP',
      }),
    );

    // Create a test examiner
    testExaminer = await User.create(
      fake(User, {
        role: 'practitioner',
        displayName: 'Test Examiner',
        email: 'examiner@test.com',
      }),
    );

    // Create a test patient
    testPatient = await Patient.create(
      fake(Patient, {
        displayId: 'TEST001',
        firstName: 'John',
        lastName: 'Doe',
        sex: 'male',
        villageId: testVillage.id,
      }),
    );

    // Create a test portal user
    await PortalUser.create({
      email: TEST_PATIENT_EMAIL,
      patientId: testPatient.id,
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    });

    // Login to get auth token
    authToken = await getPatientAuthToken(baseApp, store.models, TEST_PATIENT_EMAIL);
  });

  afterAll(async () => close());

  describe('GET /api/portal/me/appointments/upcoming', () => {
    beforeAll(async () => {
      const { Appointment, ReferenceData } = store.models;

      // Create test appointment type reference data
      const testAppointmentType = await ReferenceData.create(
        fake(ReferenceData, {
          type: 'appointmentType',
          name: 'Consultation',
          code: 'CONS001',
        }),
      );

      // Create a test appointment
      await Appointment.create({
        patientId: testPatient.id,
        appointmentTypeId: testAppointmentType.id,
        startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        status: 'Confirmed',
        locationGroupId: testLocationGroup.id,
        clinicianId: testExaminer.id,
      });
    });

    it('Should return upcoming appointments for authenticated request', async () => {
      const response = await baseApp
        .get('/api/portal/me/appointments/upcoming')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).toHaveSucceeded();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const appointment = response.body[0];
      expect(appointment).toHaveProperty('id');
      expect(appointment).toHaveProperty('appointmentType');
      expect(appointment.appointmentType).toHaveProperty('name', 'Consultation');
      expect(appointment).toHaveProperty('startTime');
      expect(appointment).toHaveProperty('status', 'Confirmed');
    });

    it('Should include cancelled appointments', async () => {
      // Create a new patient for this test
      const newPatient = await store.models.Patient.create(
        fake(store.models.Patient, {
          displayId: 'TEST002',
          firstName: 'Jane',
          lastName: 'Smith',
          sex: 'female',
        }),
      );

      await store.models.PortalUser.create({
        email: 'jane@test.com',
        patientId: newPatient.id,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      // Create appointment type reference data
      const testAppointmentType = await store.models.ReferenceData.create(
        fake(store.models.ReferenceData, {
          type: 'appointmentType',
          name: 'Checkup',
          code: 'CHECK001',
        }),
      );

      // Create cancelled appointment
      await store.models.Appointment.create({
        patientId: newPatient.id,
        appointmentTypeId: testAppointmentType.id,
        startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
        status: 'Cancelled',
        locationGroupId: testLocationGroup.id,
        clinicianId: testExaminer.id,
      });

      const newAuthToken = await getPatientAuthToken(baseApp, store.models, 'jane@test.com');

      const response = await baseApp
        .get('/api/portal/me/appointments/upcoming')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1); // Should include cancelled appointment

      const appointment = response.body[0];
      expect(appointment).toHaveProperty('id');
      expect(appointment).toHaveProperty('appointmentType');
      expect(appointment.appointmentType).toHaveProperty('name', 'Checkup');
      expect(appointment).toHaveProperty('startTime');
      expect(appointment).toHaveProperty('status', 'Cancelled');
    });

    it('Should exclude past appointments (before start of current day)', async () => {
      // Create a new patient for this test
      const newPatient = await store.models.Patient.create(
        fake(store.models.Patient, {
          displayId: 'TEST003',
          firstName: 'Bob',
          lastName: 'Johnson',
          sex: 'male',
        }),
      );

      await store.models.PortalUser.create({
        email: 'bob@test.com',
        patientId: newPatient.id,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      // Create appointment type reference data
      const testAppointmentType = await store.models.ReferenceData.create(
        fake(store.models.ReferenceData, {
          type: 'appointmentType',
          name: 'Past Appointment',
          code: 'PAST001',
        }),
      );

      // Create past appointment (yesterday)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(14, 0, 0, 0); // 2 PM yesterday

      await store.models.Appointment.create({
        patientId: newPatient.id,
        appointmentTypeId: testAppointmentType.id,
        startTime: toDateTimeString(yesterday),
        status: 'Confirmed',
        locationGroupId: testLocationGroup.id,
        clinicianId: testExaminer.id,
      });

      // Create future appointment (tomorrow)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0); // 2 PM tomorrow

      await store.models.Appointment.create({
        patientId: newPatient.id,
        appointmentTypeId: testAppointmentType.id,
        startTime: toDateTimeString(tomorrow),
        status: 'Confirmed',
        locationGroupId: testLocationGroup.id,
        clinicianId: testExaminer.id,
      });

      const newAuthToken = await getPatientAuthToken(baseApp, store.models, 'bob@test.com');

      const response = await baseApp
        .get('/api/portal/me/appointments/upcoming')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1); // Should only return future appointment

      const appointment = response.body[0];
      expect(appointment).toHaveProperty('startTime');
      // Verify it's the future appointment (should be tomorrow)
      const appointmentDate = new Date(appointment.startTime);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expect(appointmentDate.getTime()).toBeGreaterThan(today.getTime());
    });

    it('Should handle appointment without clinician gracefully', async () => {
      // Create a new patient for this test
      const newPatient = await store.models.Patient.create(
        fake(store.models.Patient, {
          displayId: 'TEST004',
          firstName: 'Alice',
          lastName: 'Brown',
          sex: 'female',
        }),
      );

      await store.models.PortalUser.create({
        email: 'alice@test.com',
        patientId: newPatient.id,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      // Create appointment type reference data
      const testAppointmentType = await store.models.ReferenceData.create(
        fake(store.models.ReferenceData, {
          type: 'appointmentType',
          name: 'Checkup',
          code: 'CHECK001',
        }),
      );

      // Create appointment without clinician
      await store.models.Appointment.create({
        patientId: newPatient.id,
        appointmentTypeId: testAppointmentType.id,
        startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
        status: 'Confirmed',
        locationGroupId: testLocationGroup.id,
        clinicianId: null, // No clinician
      });

      const newAuthToken = await getPatientAuthToken(baseApp, store.models, 'alice@test.com');

      const response = await baseApp
        .get('/api/portal/me/appointments/upcoming')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const appointment = response.body[0];
      expect(appointment).toHaveProperty('id');
      expect(appointment).toHaveProperty('appointmentType');
      expect(appointment.appointmentType).toHaveProperty('name', 'Checkup');
      expect(appointment).toHaveProperty('startTime');
      expect(appointment).toHaveProperty('status', 'Confirmed');
      // Should handle null clinician gracefully
    });

    it('Should handle appointment with null notes gracefully', async () => {
      // Create another patient for this test
      const patientWithNullNotes = await store.models.Patient.create(
        fake(store.models.Patient, {
          displayId: 'TEST005',
          firstName: 'Charlie',
          lastName: 'Wilson',
          sex: 'male',
        }),
      );

      await store.models.PortalUser.create({
        email: 'charlie@test.com',
        patientId: patientWithNullNotes.id,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      // Create appointment type reference data
      const testAppointmentType = await store.models.ReferenceData.create(
        fake(store.models.ReferenceData, {
          type: 'appointmentType',
          name: 'Test Appointment',
          code: 'TEST001',
        }),
      );

      // Create appointment with null notes
      await store.models.Appointment.create({
        patientId: patientWithNullNotes.id,
        appointmentTypeId: testAppointmentType.id,
        startTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days from now
        status: 'Confirmed',
        locationGroupId: testLocationGroup.id,
        clinicianId: testExaminer.id,
        notes: null, // Null notes
      });

      const newAuthToken = await getPatientAuthToken(baseApp, store.models, 'charlie@test.com');

      const response = await baseApp
        .get('/api/portal/me/appointments/upcoming')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const appointment = response.body[0];
      expect(appointment).toHaveProperty('id');
      expect(appointment).toHaveProperty('appointmentType');
      expect(appointment.appointmentType).toHaveProperty('name', 'Test Appointment');
      expect(appointment).toHaveProperty('startTime');
      expect(appointment).toHaveProperty('status', 'Confirmed');
      // Should handle null notes gracefully
    });

    it('Should return empty array when patient has no upcoming appointments', async () => {
      // Create a new patient without appointments
      const newPatient = await store.models.Patient.create(
        fake(store.models.Patient, {
          displayId: 'TEST006',
          firstName: 'Diana',
          lastName: 'Miller',
          sex: 'female',
        }),
      );

      await store.models.PortalUser.create({
        email: 'diana@test.com',
        patientId: newPatient.id,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      const newAuthToken = await getPatientAuthToken(baseApp, store.models, 'diana@test.com');

      const response = await baseApp
        .get('/api/portal/me/appointments/upcoming')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('Should reject request without authorization header', async () => {
      const response = await baseApp.get('/api/portal/me/appointments/upcoming');
      expect(response).toHaveRequestError();
    });
  });
});
