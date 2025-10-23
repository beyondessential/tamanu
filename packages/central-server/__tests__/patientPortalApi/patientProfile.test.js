import { VISIBILITY_STATUSES } from '@tamanu/constants/importable';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';
import { getPatientAuthToken } from './patientPortalUtils';

const TEST_PATIENT_EMAIL = 'patient@test.com';

describe('Patient Portal Profile Endpoints', () => {
  let baseApp;
  let store;
  let close;
  let testPatient;
  let authToken;
  let testVillage;

  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    close = ctx.close;
    store = ctx.store;
    const { Patient, PortalUser, ReferenceData, Setting } = store.models;

    await Setting.set('features.patientPortal', true);
    
    // Create a test village
    testVillage = await ReferenceData.create(
      fake(ReferenceData, {
        type: 'village',
        name: 'Test Village',
        code: 'TEST001',
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

  describe('GET /api/portal/me', () => {
    it('Should return patient information for authenticated request', async () => {
      const response = await baseApp
        .get('/api/portal/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('id', testPatient.id);
      expect(response.body).toHaveProperty('displayId', 'TEST001');
      expect(response.body).toHaveProperty('firstName', 'John');
      expect(response.body).toHaveProperty('lastName', 'Doe');
      expect(response.body).toHaveProperty('sex', 'male');
      expect(response.body).toHaveProperty('village');
      expect(response.body.village).toHaveProperty('id', testVillage.id);
      expect(response.body.village).toHaveProperty('name', 'Test Village');
    });

    it('Should handle patient without village gracefully', async () => {
      // Create a new patient without village
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

      const newAuthToken = await getPatientAuthToken(baseApp, store.models, 'jane@test.com');

      const response = await baseApp
        .get('/api/portal/me')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('id', newPatient.id);
      expect(response.body).toHaveProperty('displayId', 'TEST002');
      expect(response.body).toHaveProperty('firstName', 'Jane');
      expect(response.body).toHaveProperty('lastName', 'Smith');
      expect(response.body).toHaveProperty('sex', 'female');
      // Village should be null or undefined when patient has no village
      expect(response.body.village).toBeUndefined();
    });

    it('Should handle patient with null middleName', async () => {
      // Create a patient with null middleName
      const patientWithNullMiddleName = await store.models.Patient.create(
        fake(store.models.Patient, {
          displayId: 'TEST003',
          firstName: 'Bob',
          middleName: null,
          lastName: 'Johnson',
          sex: 'male',
          villageId: testVillage.id,
        }),
      );

      await store.models.PortalUser.create({
        email: 'bob@test.com',
        patientId: patientWithNullMiddleName.id,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      const newAuthToken = await getPatientAuthToken(baseApp, store.models, 'bob@test.com');

      const response = await baseApp
        .get('/api/portal/me')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('id', patientWithNullMiddleName.id);
      expect(response.body).toHaveProperty('firstName', 'Bob');
      expect(response.body).toHaveProperty('lastName', 'Johnson');
      expect(response.body).toHaveProperty('sex', 'male');
      // middleName should be null
      expect(response.body.middleName).toBeUndefined();
    });

    it('Should handle patient with undefined middleName', async () => {
      // Create a patient with undefined middleName
      const patientWithUndefinedMiddleName = await store.models.Patient.create(
        fake(store.models.Patient, {
          displayId: 'TEST004',
          firstName: 'Alice',
          middleName: undefined,
          lastName: 'Brown',
          sex: 'female',
          villageId: testVillage.id,
        }),
      );

      await store.models.PortalUser.create({
        email: 'alice@test.com',
        patientId: patientWithUndefinedMiddleName.id,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      const newAuthToken = await getPatientAuthToken(baseApp, store.models, 'alice@test.com');

      const response = await baseApp
        .get('/api/portal/me')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('id', patientWithUndefinedMiddleName.id);
      expect(response.body).toHaveProperty('firstName', 'Alice');
      expect(response.body).toHaveProperty('lastName', 'Brown');
      expect(response.body).toHaveProperty('sex', 'female');
      // middleName should be null
      expect(response.body.middleName).toBeUndefined();
    });

    it('Should reject request without authorization header', async () => {
      const response = await baseApp.get('/api/portal/me');
      expect(response).toHaveRequestError();
    });
  });
});
