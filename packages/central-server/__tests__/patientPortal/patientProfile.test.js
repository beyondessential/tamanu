import { VISIBILITY_STATUSES } from '@tamanu/constants/importable';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';

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
    const { Patient, PatientUser, ReferenceData } = store.models;

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

    // Create a test patient user
    await PatientUser.create({
      email: TEST_PATIENT_EMAIL,
      patientId: testPatient.id,
      role: 'patient',
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    });

    // Login to get auth token
    const loginResponse = await baseApp.post('/api/portal/login').send({
      email: TEST_PATIENT_EMAIL,
    });

    expect(loginResponse).toHaveSucceeded();
    authToken = loginResponse.body.token;
  });

  afterAll(async () => close());

  describe('GET /api/portal/me', () => {
    it('Should return patient information for authenticated request', async () => {
      const response = await baseApp
        .get('/api/portal/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', testPatient.id);
      expect(response.body.data).toHaveProperty('displayId', 'TEST001');
      expect(response.body.data).toHaveProperty('firstName', 'John');
      expect(response.body.data).toHaveProperty('lastName', 'Doe');
      expect(response.body.data).toHaveProperty('sex', 'male');
      expect(response.body.data).toHaveProperty('village');
      expect(response.body.data.village).toHaveProperty('id', testVillage.id);
      expect(response.body.data.village).toHaveProperty('name', 'Test Village');
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

      await store.models.PatientUser.create({
        email: 'jane@test.com',
        patientId: newPatient.id,
        role: 'patient',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      const loginResponse = await baseApp.post('/api/portal/login').send({
        email: 'jane@test.com',
      });

      const newAuthToken = loginResponse.body.token;

      const response = await baseApp
        .get('/api/portal/me')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', newPatient.id);
      expect(response.body.data).toHaveProperty('displayId', 'TEST002');
      expect(response.body.data).toHaveProperty('firstName', 'Jane');
      expect(response.body.data).toHaveProperty('lastName', 'Smith');
      expect(response.body.data).toHaveProperty('sex', 'female');
      // Village should be null or undefined when patient has no village
      expect(response.body.data.village).toBeUndefined();
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

      await store.models.PatientUser.create({
        email: 'bob@test.com',
        patientId: patientWithNullMiddleName.id,
        role: 'patient',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      const loginResponse = await baseApp.post('/api/portal/login').send({
        email: 'bob@test.com',
      });

      const newAuthToken = loginResponse.body.token;

      const response = await baseApp
        .get('/api/portal/me')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', patientWithNullMiddleName.id);
      expect(response.body.data).toHaveProperty('firstName', 'Bob');
      expect(response.body.data).toHaveProperty('lastName', 'Johnson');
      expect(response.body.data).toHaveProperty('sex', 'male');
      // middleName should be null
      expect(response.body.data.middleName).toBeUndefined();
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

      await store.models.PatientUser.create({
        email: 'alice@test.com',
        patientId: patientWithUndefinedMiddleName.id,
        role: 'patient',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      const loginResponse = await baseApp.post('/api/portal/login').send({
        email: 'alice@test.com',
      });

      const newAuthToken = loginResponse.body.token;

      const response = await baseApp
        .get('/api/portal/me')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', patientWithUndefinedMiddleName.id);
      expect(response.body.data).toHaveProperty('firstName', 'Alice');
      expect(response.body.data).toHaveProperty('lastName', 'Brown');
      expect(response.body.data).toHaveProperty('sex', 'female');
      // middleName should be null
      expect(response.body.data.middleName).toBeUndefined();
    });

    it('Should reject request without authorization header', async () => {
      const response = await baseApp.get('/api/portal/me');
      expect(response).toHaveRequestError();
    });
  });
});
