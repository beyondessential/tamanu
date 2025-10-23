import { VISIBILITY_STATUSES } from '@tamanu/constants/importable';
import { fake } from '@tamanu/fake-data/fake';
import { KEYS_EXPOSED_TO_PATIENT_PORTAL } from '@tamanu/settings';
import { createTestContext } from '../utilities';
import { getPatientAuthToken } from './patientPortalUtils';
import { describe } from 'node:test';
import { SETTINGS_SCOPES } from '@tamanu/constants';

const TEST_PATIENT_EMAIL = 'settings-test@example.com';

describe('Patient Portal Settings', () => {
  let baseApp;
  let store;
  let close;
  let authToken;
  let testPatient;
  let testFacility;

  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    close = ctx.close;
    store = ctx.store;
    const { Patient, PortalUser, Setting, Facility } = store.models;

    // Enable patient portal
    await Setting.set('features.patientPortal', true);

    // Create test facility
    testFacility = await Facility.create(fake(Facility));

    // Create test patient
    testPatient = await Patient.create(
      fake(Patient, {
        displayId: 'SETTINGS_TEST_001',
        firstName: 'Settings',
        lastName: 'Test',
        sex: 'male',
      }),
    );

    // Create test portal user
    await PortalUser.create({
      email: TEST_PATIENT_EMAIL,
      patientId: testPatient.id,
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    });

    // Get auth token
    authToken = await getPatientAuthToken(baseApp, store.models, TEST_PATIENT_EMAIL);

    // Set up some test settings
    await Setting.set('fileChooserMbSizeLimit', 5, SETTINGS_SCOPES.GLOBAL);
    await Setting.set(
      'sensitiveData.secretKey',
      'should-not-be-exposed',
      SETTINGS_SCOPES.FACILITY,
      testFacility.id,
    );
    await Setting.set('admin.password', 'admin123', SETTINGS_SCOPES.GLOBAL);
  });

  afterAll(async () => close());

  describe('GET /api/portal/settings/:facilityId', () => {
    it('should return only keys exposed to patient portal', async () => {
      const response = await baseApp
        .get(`/api/portal/settings/${testFacility.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).toHaveSucceeded();

      // Check that response contains only exposed keys
      const responseKeys = Object.keys(response.body);
      const exposedKeys = [...KEYS_EXPOSED_TO_PATIENT_PORTAL];

      // Verify each response key is in the allowed list
      responseKeys.forEach(key => {
        expect(exposedKeys).toContain(key);
      });

      // Verify that all exposed keys that have values are present
      expect(response.body.features).toBeDefined();
      expect(response.body.fileChooserMbSizeLimit).toBe(5);
    });

    it('should not expose sensitive settings', async () => {
      const response = await baseApp
        .get(`/api/portal/settings/${testFacility.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).toHaveSucceeded();

      // Verify sensitive data is not exposed
      expect(response.body).not.toHaveProperty('sensitiveData');
      expect(response.body).not.toHaveProperty('admin');
      expect(response.body).not.toHaveProperty('secretKey');
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('fhir');
      expect(response.body).not.toHaveProperty('reportProcess');
      expect(response.body).not.toHaveProperty('sync');
    });

    it('should require authentication', async () => {
      const response = await baseApp.get(`/api/portal/settings/${testFacility.id}`);

      expect(response).toHaveRequestError();
    });

    it('should reject invalid authentication token', async () => {
      const response = await baseApp
        .get(`/api/portal/settings/${testFacility.id}`)
        .set('Authorization', 'Bearer invalid-token');

      expect(response).toHaveRequestError();
    });

    it('should handle non-existent facility ID gracefully', async () => {
      const nonExistentFacilityId = 'non-existent-facility-id';

      const response = await baseApp
        .get(`/api/portal/settings/${nonExistentFacilityId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Should still succeed but return empty or default settings
      expect(response).toHaveSucceeded();

      // Response should still only contain allowed keys
      const responseKeys = Object.keys(response.body);
      const exposedKeys = [...KEYS_EXPOSED_TO_PATIENT_PORTAL];

      responseKeys.forEach(key => {
        expect(exposedKeys).toContain(key);
      });
    });

    it('should return consistent structure with only allowed keys', async () => {
      const response = await baseApp
        .get(`/api/portal/settings/${testFacility.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).toHaveSucceeded();

      // Verify the response structure matches KEYS_EXPOSED_TO_PATIENT_PORTAL
      const allowedKeys = new Set(KEYS_EXPOSED_TO_PATIENT_PORTAL);
      const responseKeys = new Set(Object.keys(response.body));

      // All response keys should be in allowed keys
      expect([...responseKeys].every(key => allowedKeys.has(key))).toBe(true);

      // Response should be an object
      expect(typeof response.body).toBe('object');
      expect(response.body).not.toBeNull();
      expect(Array.isArray(response.body)).toBe(false);
    });
  });
});
