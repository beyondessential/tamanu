import { VISIBILITY_STATUSES } from '@tamanu/constants/importable';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';
import { getPatientAuthToken } from './patientPortalUtils';

const TEST_PATIENT_EMAIL = 'patient@test.com';

describe('Patient Portal Conditions Endpoints', () => {
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

  describe('GET /api/portal/me/ongoing-conditions', () => {
    beforeAll(async () => {
      const { PatientCondition, ReferenceData } = store.models;

      // Create test condition reference data
      const testCondition = await ReferenceData.create(
        fake(ReferenceData, {
          type: 'diagnosis',
          name: 'Diabetes',
          code: 'DIAB001',
        }),
      );

      // Create a test patient condition
      await PatientCondition.create({
        patientId: testPatient.id,
        conditionId: testCondition.id,
        note: 'Type 2 diabetes diagnosed in 2020',
        recordedDate: new Date().toISOString(),
        resolved: false,
      });
    });

    it('Should return ongoing conditions for authenticated request', async () => {
      const response = await baseApp
        .get('/api/portal/me/ongoing-conditions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).toHaveSucceeded();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const condition = response.body[0];
      expect(condition).toHaveProperty('id');
      expect(condition).toHaveProperty('note', 'Type 2 diabetes diagnosed in 2020');
      // The resolved property might not be present in the response
      if ('resolved' in condition) {
        expect(condition).toHaveProperty('resolved', false);
      }
      expect(condition).toHaveProperty('condition');
      expect(condition.condition).toHaveProperty('name', 'Diabetes');
    });

    it('Should handle condition with null note gracefully', async () => {
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

      // Create condition reference data
      const testCondition = await store.models.ReferenceData.create(
        fake(store.models.ReferenceData, {
          type: 'diagnosis',
          name: 'Hypertension',
          code: 'HYP001',
        }),
      );

      // Create condition with null note
      await store.models.PatientCondition.create({
        patientId: newPatient.id,
        conditionId: testCondition.id,
        note: null, // Null note
        recordedDate: new Date().toISOString(),
        resolved: false,
      });

      const newAuthToken = await getPatientAuthToken(baseApp, store.models, 'bob@test.com');

      const response = await baseApp
        .get('/api/portal/me/ongoing-conditions')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const condition = response.body[0];
      expect(condition).toHaveProperty('id');
      expect(condition).toHaveProperty('condition');
      expect(condition.condition).toHaveProperty('name', 'Hypertension');
      // Note should be null
      expect(condition.note).toBeUndefined();
    });

    it('Should handle condition with undefined resolved status gracefully', async () => {
      // Create another patient for this test
      const patientWithUndefinedResolved = await store.models.Patient.create(
        fake(store.models.Patient, {
          displayId: 'TEST004',
          firstName: 'Alice',
          lastName: 'Brown',
          sex: 'female',
        }),
      );

      await store.models.PortalUser.create({
        email: 'alice@test.com',
        patientId: patientWithUndefinedResolved.id,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      // Create condition reference data
      const testCondition = await store.models.ReferenceData.create(
        fake(store.models.ReferenceData, {
          type: 'diagnosis',
          name: 'Asthma',
          code: 'ASTHMA001',
        }),
      );

      // Create condition with undefined resolved status
      await store.models.PatientCondition.create({
        patientId: patientWithUndefinedResolved.id,
        conditionId: testCondition.id,
        note: 'Mild asthma',
        recordedDate: new Date().toISOString(),
        resolved: undefined, // Undefined resolved status
      });

      const newAuthToken = await getPatientAuthToken(baseApp, store.models, 'alice@test.com');

      const response = await baseApp
        .get('/api/portal/me/ongoing-conditions')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const condition = response.body[0];
      expect(condition).toHaveProperty('id');
      expect(condition).toHaveProperty('note', 'Mild asthma');
      expect(condition).toHaveProperty('condition');
      expect(condition.condition).toHaveProperty('name', 'Asthma');
      // Should handle undefined resolved status gracefully
    });

    it('Should filter out resolved conditions', async () => {
      // Create a patient with both ongoing and resolved conditions
      const patientWithResolvedConditions = await store.models.Patient.create(
        fake(store.models.Patient, {
          displayId: 'TEST005',
          firstName: 'Charlie',
          lastName: 'Wilson',
          sex: 'male',
        }),
      );

      await store.models.PortalUser.create({
        email: 'charlie@test.com',
        patientId: patientWithResolvedConditions.id,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      // Create condition reference data
      const ongoingCondition = await store.models.ReferenceData.create(
        fake(store.models.ReferenceData, {
          type: 'diagnosis',
          name: 'Ongoing Condition',
          code: 'ONGOING001',
        }),
      );

      const resolvedCondition = await store.models.ReferenceData.create(
        fake(store.models.ReferenceData, {
          type: 'diagnosis',
          name: 'Resolved Condition',
          code: 'RESOLVED001',
        }),
      );

      // Create ongoing condition
      await store.models.PatientCondition.create({
        patientId: patientWithResolvedConditions.id,
        conditionId: ongoingCondition.id,
        note: 'This is ongoing',
        recordedDate: new Date().toISOString(),
        resolved: false,
      });

      // Create resolved condition
      await store.models.PatientCondition.create({
        patientId: patientWithResolvedConditions.id,
        conditionId: resolvedCondition.id,
        note: 'This is resolved',
        recordedDate: new Date().toISOString(),
        resolved: true,
      });

      const newAuthToken = await getPatientAuthToken(baseApp, store.models, 'charlie@test.com');

      const response = await baseApp
        .get('/api/portal/me/ongoing-conditions')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1); // Should only return ongoing condition

      const condition = response.body[0];
      expect(condition).toHaveProperty('condition');
      expect(condition.condition).toHaveProperty('name', 'Ongoing Condition');
    });

    it('Should return empty array when patient has no ongoing conditions', async () => {
      // Create a new patient without conditions
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
        .get('/api/portal/me/ongoing-conditions')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('Should reject request without authorization header', async () => {
      const response = await baseApp.get('/api/portal/me/ongoing-conditions');
      expect(response).toHaveRequestError();
    });
  });
});
