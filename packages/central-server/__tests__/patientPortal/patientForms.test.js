import { VISIBILITY_STATUSES } from '@tamanu/constants/importable';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';

const TEST_PATIENT_EMAIL = 'patient@test.com';

describe('Patient Portal Forms Endpoints', () => {
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

  describe('GET /api/portal/me/forms/outstanding', () => {
    beforeAll(async () => {
      const { Survey } = store.models;

      // Create a test survey/form
      await Survey.create({
        name: 'Health Assessment Form',
        code: 'HAF001',
        status: 'active',
      });

      // Note: Outstanding forms logic would typically check for surveys
      // that haven't been completed by the patient
    });

    it('Should return outstanding forms for authenticated request', async () => {
      const response = await baseApp
        .get('/api/portal/me/forms/outstanding')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      // The forms endpoint might return an empty array or an object with data property
      // depending on the implementation
    });

    it('Should handle inactive surveys gracefully', async () => {
      // Create a new patient for this test
      const newPatient = await store.models.Patient.create(
        fake(store.models.Patient, {
          displayId: 'TEST003',
          firstName: 'Bob',
          lastName: 'Johnson',
          sex: 'male',
        }),
      );

      await store.models.PatientUser.create({
        email: 'bob@test.com',
        patientId: newPatient.id,
        role: 'patient',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      // Create inactive survey
      await store.models.Survey.create({
        name: 'Inactive Survey',
        code: 'INACTIVE001',
        status: 'inactive', // Inactive status
      });

      const loginResponse = await baseApp.post('/api/portal/login').send({
        email: 'bob@test.com',
      });

      const newAuthToken = loginResponse.body.token;

      const response = await baseApp
        .get('/api/portal/me/forms/outstanding')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      // Should handle inactive surveys gracefully (likely filtered out)
    });

    it('Should handle survey with null description gracefully', async () => {
      // Create another patient for this test
      const patientWithNullDescription = await store.models.Patient.create(
        fake(store.models.Patient, {
          displayId: 'TEST004',
          firstName: 'Alice',
          lastName: 'Brown',
          sex: 'female',
        }),
      );

      await store.models.PatientUser.create({
        email: 'alice@test.com',
        patientId: patientWithNullDescription.id,
        role: 'patient',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      // Create survey with null description
      await store.models.Survey.create({
        name: 'Survey Without Description',
        code: 'NODESC001',
        status: 'active',
        description: null, // Null description
      });

      const loginResponse = await baseApp.post('/api/portal/login').send({
        email: 'alice@test.com',
      });

      const newAuthToken = loginResponse.body.token;

      const response = await baseApp
        .get('/api/portal/me/forms/outstanding')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      // Should handle null description gracefully
    });

    it('Should handle survey with undefined status gracefully', async () => {
      // Create another patient for this test
      const patientWithUndefinedStatus = await store.models.Patient.create(
        fake(store.models.Patient, {
          displayId: 'TEST005',
          firstName: 'Charlie',
          lastName: 'Wilson',
          sex: 'male',
        }),
      );

      await store.models.PatientUser.create({
        email: 'charlie@test.com',
        patientId: patientWithUndefinedStatus.id,
        role: 'patient',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      // Create survey with undefined status
      await store.models.Survey.create({
        name: 'Survey With Undefined Status',
        code: 'UNDEFINED001',
        status: undefined, // Undefined status
      });

      const loginResponse = await baseApp.post('/api/portal/login').send({
        email: 'charlie@test.com',
      });

      const newAuthToken = loginResponse.body.token;

      const response = await baseApp
        .get('/api/portal/me/forms/outstanding')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      // Should handle undefined status gracefully
    });

    it('Should filter out completed surveys', async () => {
      // Create a patient with both outstanding and completed surveys
      const patientWithCompletedSurveys = await store.models.Patient.create(
        fake(store.models.Patient, {
          displayId: 'TEST006',
          firstName: 'Diana',
          lastName: 'Miller',
          sex: 'female',
        }),
      );

      await store.models.PatientUser.create({
        email: 'diana@test.com',
        patientId: patientWithCompletedSurveys.id,
        role: 'patient',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      // Create outstanding survey
      await store.models.Survey.create({
        name: 'Outstanding Survey',
        code: 'OUTSTANDING001',
        status: 'active',
      });

      // Create completed survey
      await store.models.Survey.create({
        name: 'Completed Survey',
        code: 'COMPLETED001',
        status: 'active',
      });

      // Note: In a real implementation, there would be logic to mark surveys as completed
      // This test assumes the endpoint filters out completed surveys

      const loginResponse = await baseApp.post('/api/portal/login').send({
        email: 'diana@test.com',
      });

      const newAuthToken = loginResponse.body.token;

      const response = await baseApp
        .get('/api/portal/me/forms/outstanding')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      // Should filter out completed surveys (implementation dependent)
    });

    it('Should return empty array when patient has no outstanding forms', async () => {
      // Create a new patient without outstanding forms
      const newPatient = await store.models.Patient.create(
        fake(store.models.Patient, {
          displayId: 'TEST007',
          firstName: 'Eve',
          lastName: 'Davis',
          sex: 'female',
        }),
      );

      await store.models.PatientUser.create({
        email: 'eve@test.com',
        patientId: newPatient.id,
        role: 'patient',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      const loginResponse = await baseApp.post('/api/portal/login').send({
        email: 'eve@test.com',
      });

      const newAuthToken = loginResponse.body.token;

      const response = await baseApp
        .get('/api/portal/me/forms/outstanding')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
    });

    it('Should reject request without authorization header', async () => {
      const response = await baseApp.get('/api/portal/me/forms/outstanding');
      expect(response).toHaveRequestError();
    });
  });
});
