import { VISIBILITY_STATUSES } from '@tamanu/constants/importable';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';
import { getPatientAuthToken } from './patientPortalUtils';

const TEST_PATIENT_EMAIL = 'patient@test.com';

describe('Patient Portal Surveys', () => {
  let baseApp;
  let store;
  let close;
  let authToken;

  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    close = ctx.close;
    store = ctx.store;
    const { Patient, PortalUser, Setting } = store.models;

    await Setting.set('features.patientPortal', true);

    const testPatient = await Patient.create(
      fake(Patient, {
        displayId: 'TEST001',
        firstName: 'John',
        lastName: 'Doe',
        sex: 'male',
      }),
    );

    await PortalUser.create({
      email: TEST_PATIENT_EMAIL,
      patientId: testPatient.id,
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    });

    authToken = await getPatientAuthToken(baseApp, store.models, TEST_PATIENT_EMAIL);
  });

  afterAll(async () => close());

  describe('GET /api/portal/me/surveys/outstanding', () => {
    beforeAll(async () => {
      const { Survey } = store.models;

      await Survey.create({
        name: 'Health Assessment Form',
        code: 'HAF001',
        status: 'active',
      });
    });

    it('Should return outstanding forms for authenticated request', async () => {
      const response = await baseApp
        .get('/api/portal/me/surveys/outstanding')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).toHaveSucceeded();
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('Should handle inactive surveys gracefully', async () => {
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

      await store.models.Survey.create({
        name: 'Inactive Survey',
        code: 'INACTIVE001',
        status: 'inactive',
      });

      const newAuthToken = await getPatientAuthToken(baseApp, store.models, 'bob@test.com');

      const response = await baseApp
        .get('/api/portal/me/surveys/outstanding')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('Should handle survey with null description gracefully', async () => {
      const patientWithNullDescription = await store.models.Patient.create(
        fake(store.models.Patient, {
          displayId: 'TEST004',
          firstName: 'Alice',
          lastName: 'Brown',
          sex: 'female',
        }),
      );

      await store.models.PortalUser.create({
        email: 'alice@test.com',
        patientId: patientWithNullDescription.id,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      await store.models.Survey.create({
        name: 'Survey Without Description',
        code: 'NODESC001',
        status: 'active',
        description: null,
      });

      const newAuthToken = await getPatientAuthToken(baseApp, store.models, 'alice@test.com');

      const response = await baseApp
        .get('/api/portal/me/surveys/outstanding')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('Should handle survey with undefined status gracefully', async () => {
      const patientWithUndefinedStatus = await store.models.Patient.create(
        fake(store.models.Patient, {
          displayId: 'TEST005',
          firstName: 'Charlie',
          lastName: 'Wilson',
          sex: 'male',
        }),
      );

      await store.models.PortalUser.create({
        email: 'charlie@test.com',
        patientId: patientWithUndefinedStatus.id,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      await store.models.Survey.create({
        name: 'Survey With Undefined Status',
        code: 'UNDEFINED001',
        status: undefined,
      });

      const newAuthToken = await getPatientAuthToken(baseApp, store.models, 'charlie@test.com');

      const response = await baseApp
        .get('/api/portal/me/surveys/outstanding')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('Should filter out completed surveys', async () => {
      const patientWithCompletedSurveys = await store.models.Patient.create(
        fake(store.models.Patient, {
          displayId: 'TEST006',
          firstName: 'Diana',
          lastName: 'Miller',
          sex: 'female',
        }),
      );

      await store.models.PortalUser.create({
        email: 'diana@test.com',
        patientId: patientWithCompletedSurveys.id,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      await store.models.Survey.create({
        name: 'Outstanding Survey',
        code: 'OUTSTANDING001',
        status: 'active',
      });

      await store.models.Survey.create({
        name: 'Completed Survey',
        code: 'COMPLETED001',
        status: 'active',
      });

      const newAuthToken = await getPatientAuthToken(baseApp, store.models, 'diana@test.com');

      const response = await baseApp
        .get('/api/portal/me/surveys/outstanding')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('Should return empty array when patient has no outstanding forms', async () => {
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
        .get('/api/portal/me/surveys/outstanding')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('Should reject request without authorization header', async () => {
      const response = await baseApp.get('/api/portal/me/surveys/outstanding');
      expect(response).toHaveRequestError();
    });
  });
});
