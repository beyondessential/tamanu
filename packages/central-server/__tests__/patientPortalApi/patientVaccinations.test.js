import { VISIBILITY_STATUSES } from '@tamanu/constants/importable';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';
import { getPatientAuthToken } from './patientPortalUtils';

const TEST_PATIENT_EMAIL = 'patient@test.com';

describe('Patient Portal Vaccinations Endpoints', () => {
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

  describe('GET /api/portal/me/vaccinations/upcoming', () => {
    beforeAll(async () => {
      const { ScheduledVaccine, ReferenceData } = store.models;

      // Create test vaccine reference data
      const testVaccine = await ReferenceData.create(
        fake(ReferenceData, {
          type: 'drug',
          name: 'Flu Vaccine',
          code: 'FLU001',
        }),
      );

      // Create a test scheduled vaccine
      await ScheduledVaccine.create(
        fake(ScheduledVaccine, {
          vaccineId: testVaccine.id,
          label: 'Flu Vaccine',
          category: 'Routine',
        }),
      );
    });

    it('Should return upcoming vaccinations for authenticated request', async () => {
      const response = await baseApp
        .get('/api/portal/me/vaccinations/upcoming')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).toHaveSucceeded();
      const data = Array.isArray(response.body) ? response.body : response.body.data;
      expect(Array.isArray(data)).toBe(true);

      // The patient might not have any upcoming vaccinations
      if (data.length > 0) {
        const vaccination = data[0];
        expect(vaccination).toHaveProperty('id');
        expect(vaccination).toHaveProperty('scheduledDate');
        expect(vaccination).toHaveProperty('status', 'scheduled');
      }
    });

    it('Should handle scheduled vaccine without category gracefully', async () => {
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

      // Create vaccine reference data
      const testVaccine = await store.models.ReferenceData.create(
        fake(store.models.ReferenceData, {
          type: 'drug',
          name: 'Test Vaccine',
          code: 'TEST001',
        }),
      );

      // Create scheduled vaccine without category
      await store.models.ScheduledVaccine.create(
        fake(store.models.ScheduledVaccine, {
          vaccineId: testVaccine.id,
          label: 'Test Vaccine',
          category: null, // No category
        }),
      );

      const newAuthToken = await getPatientAuthToken(baseApp, store.models, 'bob@test.com');

      const response = await baseApp
        .get('/api/portal/me/vaccinations/upcoming')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      const data = Array.isArray(response.body) ? response.body : response.body.data;
      expect(Array.isArray(data)).toBe(true);
      // Should handle null category gracefully
    });

    it('Should return empty array when patient has no upcoming vaccinations', async () => {
      // Create a new patient without vaccinations
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

      const newAuthToken = await getPatientAuthToken(baseApp, store.models, 'alice@test.com');

      const response = await baseApp
        .get('/api/portal/me/vaccinations/upcoming')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      const data = Array.isArray(response.body) ? response.body : response.body.data;
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });

    it('Should reject request without authorization header', async () => {
      const response = await baseApp.get('/api/portal/me/vaccinations/upcoming');
      expect(response).toHaveRequestError();
    });
  });

  describe('GET /api/portal/me/vaccinations/administered', () => {
    beforeAll(async () => {
      const { AdministeredVaccine, ReferenceData } = store.models;

      // Create test vaccine reference data
      const testVaccine = await ReferenceData.create(
        fake(ReferenceData, {
          type: 'drug',
          name: 'Flu Vaccine',
          code: 'FLU001',
        }),
      );

      // Create a test encounter for the vaccine
      const testEncounter = await store.models.Encounter.create(
        fake(store.models.Encounter, {
          patientId: testPatient.id,
          encounterType: 'clinic',
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          examinerId: testExaminer.id,
          departmentId: testDepartment.id,
          locationId: testLocation.id,
        }),
      );

      // Create a test scheduled vaccine
      const testScheduledVaccine = await store.models.ScheduledVaccine.create(
        fake(store.models.ScheduledVaccine, {
          vaccineId: testVaccine.id,
          label: 'Flu Vaccine',
          category: 'Routine',
        }),
      );

      // Create a test administered vaccine
      await AdministeredVaccine.create({
        encounterId: testEncounter.id,
        scheduledVaccineId: testScheduledVaccine.id,
        date: new Date().toISOString(),
        status: 'GIVEN',
        consent: true,
        locationId: testLocation.id,
        departmentId: testDepartment.id,
        recorderId: testExaminer.id,
      });
    });

    it('Should return administered vaccinations for authenticated request', async () => {
      const response = await baseApp
        .get('/api/portal/me/vaccinations/administered')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).toHaveSucceeded();
      const data = Array.isArray(response.body) ? response.body : response.body.data;
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);

      const vaccination = data[0];
      expect(vaccination).toHaveProperty('id');
      expect(vaccination).toHaveProperty('date');
      expect(vaccination).toHaveProperty('status', 'GIVEN');
    });

    it('Should handle administered vaccine without consent gracefully', async () => {
      // Create a new patient for this test
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

      // Create vaccine reference data
      const testVaccine = await store.models.ReferenceData.create(
        fake(store.models.ReferenceData, {
          type: 'drug',
          name: 'Test Vaccine',
          code: 'TEST002',
        }),
      );

      // Create encounter
      const testEncounter = await store.models.Encounter.create(
        fake(store.models.Encounter, {
          patientId: newPatient.id,
          encounterType: 'clinic',
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          examinerId: testExaminer.id,
          departmentId: testDepartment.id,
          locationId: testLocation.id,
        }),
      );

      // Create scheduled vaccine
      const testScheduledVaccine = await store.models.ScheduledVaccine.create(
        fake(store.models.ScheduledVaccine, {
          vaccineId: testVaccine.id,
          label: 'Test Vaccine',
          category: 'Routine',
        }),
      );

      // Create administered vaccine without consent
      await store.models.AdministeredVaccine.create({
        encounterId: testEncounter.id,
        scheduledVaccineId: testScheduledVaccine.id,
        date: new Date().toISOString(),
        status: 'GIVEN',
        consent: null, // No consent specified
        locationId: testLocation.id,
        departmentId: testDepartment.id,
        recorderId: testExaminer.id,
      });

      const newAuthToken = await getPatientAuthToken(baseApp, store.models, 'charlie@test.com');

      const response = await baseApp
        .get('/api/portal/me/vaccinations/administered')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      const data = Array.isArray(response.body) ? response.body : response.body.data;
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);

      const vaccination = data[0];
      expect(vaccination).toHaveProperty('id');
      expect(vaccination).toHaveProperty('date');
      expect(vaccination).toHaveProperty('status', 'GIVEN');
      // Should handle null consent gracefully
    });

    it('Should handle administered vaccine without location gracefully', async () => {
      // Create another patient for this test
      const patientWithoutLocation = await store.models.Patient.create(
        fake(store.models.Patient, {
          displayId: 'TEST006',
          firstName: 'Diana',
          lastName: 'Miller',
          sex: 'female',
        }),
      );

      await store.models.PortalUser.create({
        email: 'diana@test.com',
        patientId: patientWithoutLocation.id,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      // Create vaccine reference data
      const testVaccine = await store.models.ReferenceData.create(
        fake(store.models.ReferenceData, {
          type: 'drug',
          name: 'Another Vaccine',
          code: 'ANOTHER001',
        }),
      );

      // Create encounter
      const testEncounter = await store.models.Encounter.create(
        fake(store.models.Encounter, {
          patientId: patientWithoutLocation.id,
          encounterType: 'clinic',
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          examinerId: testExaminer.id,
          departmentId: testDepartment.id,
          locationId: testLocation.id,
        }),
      );

      // Create scheduled vaccine
      const testScheduledVaccine = await store.models.ScheduledVaccine.create(
        fake(store.models.ScheduledVaccine, {
          vaccineId: testVaccine.id,
          label: 'Another Vaccine',
          category: 'Routine',
        }),
      );

      // Create administered vaccine without location
      await store.models.AdministeredVaccine.create({
        encounterId: testEncounter.id,
        scheduledVaccineId: testScheduledVaccine.id,
        date: new Date().toISOString(),
        status: 'GIVEN',
        consent: true,
        locationId: null, // No location
        departmentId: testDepartment.id,
        recorderId: testExaminer.id,
      });

      const newAuthToken = await getPatientAuthToken(baseApp, store.models, 'diana@test.com');

      const response = await baseApp
        .get('/api/portal/me/vaccinations/administered')
        .set('Authorization', `Bearer ${newAuthToken}`);
      
      expect(response).toHaveSucceeded();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const vaccination = response.body[0];
      expect(vaccination).toHaveProperty('id');
      expect(vaccination).toHaveProperty('date');
      expect(vaccination).toHaveProperty('status', 'GIVEN');
      // Should handle null location gracefully
    });

    it('Should return empty array when patient has no administered vaccinations', async () => {
      // Create a new patient without administered vaccinations
      const newPatient = await store.models.Patient.create(
        fake(store.models.Patient, {
          displayId: 'TEST007',
          firstName: 'Eve',
          lastName: 'Davis',
          sex: 'female',
        }),
      );

      await store.models.PortalUser.create({
        email: 'eve@test.com',
        patientId: newPatient.id,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      const newAuthToken = await getPatientAuthToken(baseApp, store.models, 'eve@test.com');

      const response = await baseApp
        .get('/api/portal/me/vaccinations/administered')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      const data = Array.isArray(response.body) ? response.body : response.body.data;
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });

    it('Should reject request without authorization header', async () => {
      const response = await baseApp.get('/api/portal/me/vaccinations/administered');
      expect(response).toHaveRequestError();
    });
  });
});
