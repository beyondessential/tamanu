import { VISIBILITY_STATUSES } from '@tamanu/constants/importable';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';
import { getPatientAuthToken } from './patientPortalUtils';
import { describe } from 'node:test';

const TEST_PATIENT_EMAIL = 'patient@test.com';

describe('Patient Portal Procedures Endpoints', () => {
  let baseApp;
  let store;
  let close;
  let testPatient;
  let authToken;
  let testVillage;
  let testFacility;
  let testLocationGroup;
  let testLocation;
  let testDepartment;
  let testExaminer;

  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    close = ctx.close;
    store = ctx.store;
    const {
      Patient,
      PortalUser,
      ReferenceData,
      Facility,
      LocationGroup,
      Location,
      Department,
      User,
      Setting,
    } = store.models;

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

    // Create a test location
    testLocation = await Location.create(
      fake(Location, {
        facilityId: testFacility.id,
        locationGroupId: testLocationGroup.id,
        name: 'Test Location',
        code: 'TESTLOC',
      }),
    );

    // Create a test department
    testDepartment = await Department.create(
      fake(Department, {
        facilityId: testFacility.id,
        locationId: testLocation.id,
        name: 'Test Department',
        code: 'TESTDEPT',
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

  describe('GET /api/portal/me/procedures', () => {
    beforeAll(async () => {
      const { Procedure, Encounter, ReferenceData, User } = store.models;

      // Create a test encounter for the patient
      const testEncounter = await Encounter.create(
        fake(Encounter, {
          patientId: testPatient.id,
          encounterType: 'admission',
          startDate: new Date().toISOString(),
          examinerId: testExaminer.id,
          departmentId: testDepartment.id,
          locationId: testLocation.id,
        }),
      );

      // Create test procedure type reference data
      const testProcedureType = await ReferenceData.create(
        fake(ReferenceData, {
          type: 'procedureType',
          name: 'Appendectomy',
          code: 'APPEND001',
        }),
      );

      // Create a test user as lead clinician
      const testClinician = await User.create(
        fake(User, {
          email: 'doctor@test.com',
          displayName: 'Dr. Smith',
          role: 'practitioner',
        }),
      );

      // Create a test procedure
      await Procedure.create({
        encounterId: testEncounter.id,
        procedureTypeId: testProcedureType.id,
        physicianId: testClinician.id,
        completed: true,
        date: new Date().toISOString(),
        startTime: new Date('2024-01-01T09:00:00').toISOString(),
        endTime: new Date('2024-01-01T10:30:00').toISOString(),
        note: 'Standard appendectomy procedure',
        completedNote: 'Procedure completed successfully',
      });
    });

    it('Should return procedures for authenticated request', async () => {
      const response = await baseApp
        .get('/api/portal/me/procedures')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).toHaveSucceeded();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const procedure = response.body[0];
      expect(procedure).toHaveProperty('id');
      expect(procedure).toHaveProperty('completed', true);
      expect(procedure).toHaveProperty('date');
      expect(procedure).toHaveProperty('startTime', '2024-01-01 09:00:00');
      expect(procedure).toHaveProperty('endTime', '2024-01-01 10:30:00');
      expect(procedure).toHaveProperty('note', 'Standard appendectomy procedure');
      expect(procedure).toHaveProperty('completedNote', 'Procedure completed successfully');
      expect(procedure).toHaveProperty('procedureType');
      expect(procedure.procedureType).toHaveProperty('name', 'Appendectomy');
      expect(procedure).toHaveProperty('leadClinician');
      expect(procedure.leadClinician).toHaveProperty('displayName', 'Dr. Smith');
    });

    it('Should handle procedure without lead clinician gracefully', async () => {
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

      // Create encounter for new patient
      const testEncounter = await store.models.Encounter.create(
        fake(store.models.Encounter, {
          patientId: newPatient.id,
          encounterType: 'admission',
          startDate: new Date().toISOString(),
          examinerId: testExaminer.id,
          departmentId: testDepartment.id,
          locationId: testLocation.id,
        }),
      );

      // Create procedure type reference data
      const testProcedureType = await store.models.ReferenceData.create(
        fake(store.models.ReferenceData, {
          type: 'procedureType',
          name: 'Blood Test',
          code: 'BLOOD001',
        }),
      );

      // Create procedure without lead clinician
      await store.models.Procedure.create({
        encounterId: testEncounter.id,
        procedureTypeId: testProcedureType.id,
        physicianId: null, // No lead clinician specified
        completed: false,
        date: new Date().toISOString(),
        note: 'Routine blood test',
      });

      const newAuthToken = await getPatientAuthToken(baseApp, store.models, 'bob@test.com');

      const response = await baseApp
        .get('/api/portal/me/procedures')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const procedure = response.body[0];
      expect(procedure).toHaveProperty('id');
      expect(procedure).toHaveProperty('completed', false);
      expect(procedure).toHaveProperty('note', 'Routine blood test');
      expect(procedure).toHaveProperty('procedureType');
      expect(procedure.procedureType).toHaveProperty('name', 'Blood Test');
      // Lead clinician should be null when not specified
      expect(procedure.leadClinician).toBeUndefined();
    });

    it('Should handle procedure with null notes gracefully', async () => {
      // Create another patient for this test
      const patientWithNullNote = await store.models.Patient.create(
        fake(store.models.Patient, {
          displayId: 'TEST004',
          firstName: 'Alice',
          lastName: 'Brown',
          sex: 'female',
        }),
      );

      await store.models.PortalUser.create({
        email: 'alice@test.com',
        patientId: patientWithNullNote.id,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      // Create encounter for new patient
      const testEncounter = await store.models.Encounter.create(
        fake(store.models.Encounter, {
          patientId: patientWithNullNote.id,
          encounterType: 'admission',
          startDate: new Date().toISOString(),
          examinerId: testExaminer.id,
          departmentId: testDepartment.id,
          locationId: testLocation.id,
        }),
      );

      // Create procedure type reference data
      const testProcedureType = await store.models.ReferenceData.create(
        fake(store.models.ReferenceData, {
          type: 'procedureType',
          name: 'X-Ray',
          code: 'XRAY001',
        }),
      );

      // Create procedure with null notes
      await store.models.Procedure.create({
        encounterId: testEncounter.id,
        procedureTypeId: testProcedureType.id,
        completed: true,
        date: new Date().toISOString(),
        note: null, // Null note
        completedNote: null, // Null completed note
      });

      const newAuthToken = await getPatientAuthToken(baseApp, store.models, 'alice@test.com');

      const response = await baseApp
        .get('/api/portal/me/procedures')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const procedure = response.body[0];
      expect(procedure).toHaveProperty('id');
      expect(procedure).toHaveProperty('completed', true);
      expect(procedure).toHaveProperty('procedureType');
      expect(procedure.procedureType).toHaveProperty('name', 'X-Ray');
      // Notes should be null
      expect(procedure.note).toBeUndefined();
      expect(procedure.completedNote).toBeUndefined();
    });

    it('Should return empty array when patient has no procedures', async () => {
      // Create a new patient without procedures
      const newPatient = await store.models.Patient.create(
        fake(store.models.Patient, {
          displayId: 'TEST005',
          firstName: 'Charlie',
          lastName: 'Wilson',
          sex: 'male',
        }),
      );

      await store.models.PortalUser.create({
        email: 'charlie@test.com',
        patientId: newPatient.id,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      const newAuthToken = await getPatientAuthToken(baseApp, store.models, 'charlie@test.com');

      const response = await baseApp
        .get('/api/portal/me/procedures')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('Should reject request without authorization header', async () => {
      const response = await baseApp.get('/api/portal/me/procedures');
      expect(response).toHaveRequestError();
    });
  });
});
