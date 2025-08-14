import config from 'config';
import jwt from 'jsonwebtoken';

import { JWT_TOKEN_TYPES } from '@tamanu/constants/auth';
import { VISIBILITY_STATUSES } from '@tamanu/constants/importable';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';

const TEST_PATIENT_EMAIL = 'patient@test.com';

describe('Patient Portal Auth', () => {
  let baseApp;
  let store;
  let close;
  let testPatient;
  let testPatientUser;
  let deactivatedPatientUser;

  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    close = ctx.close;
    store = ctx.store;
    const { Patient, PatientUser } = store.models;

    // Create a test patient
    testPatient = await Patient.create(
      fake(Patient, {
        displayId: 'TEST001',
        firstName: 'John',
        lastName: 'Doe',
        sex: 'male',
      }),
    );

    // Create a test patient user
    testPatientUser = await PatientUser.create({
      email: TEST_PATIENT_EMAIL,
      patientId: testPatient.id,
      role: 'patient',
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    });

    // Create a deactivated patient user for testing
    const deactivatedPatient = await Patient.create(
      fake(Patient, {
        displayId: 'TEST002',
        firstName: 'Jane',
        lastName: 'Smith',
        sex: 'female',
      }),
    );

    deactivatedPatientUser = await PatientUser.create({
      email: 'deactivated@test.com',
      patientId: deactivatedPatient.id,
      role: 'patient',
      visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
    });
  });

  afterAll(async () => close());

  describe('Patient Portal Login', () => {
    it('Should get a valid access token for correct patient credentials', async () => {
      const response = await baseApp.post('/api/portal/login').send({
        email: TEST_PATIENT_EMAIL,
      });

      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('token');

      const contents = jwt.decode(response.body.token);

      expect(contents).toEqual({
        aud: JWT_TOKEN_TYPES.PATIENT_PORTAL_ACCESS,
        iss: config.canonicalHostName,
        patientUserId: expect.any(String),
        jti: expect.any(String),
        iat: expect.any(Number),
        exp: expect.any(Number),
      });
    });

    it('Should reject an empty email', async () => {
      const response = await baseApp.post('/api/portal/login').send({
        email: '',
      });
      expect(response).toHaveRequestError();
    });

    it('Should reject a non-existent email', async () => {
      const response = await baseApp.post('/api/portal/login').send({
        email: 'nonexistent@test.com',
      });
      expect(response).toHaveRequestError();
    });

    it('Should reject login without email', async () => {
      const response = await baseApp.post('/api/portal/login').send({});
      expect(response).toHaveRequestError();
    });

    it('Should reject a deactivated patient user', async () => {
      const response = await baseApp.post('/api/portal/login').send({
        email: deactivatedPatientUser.email,
      });
      expect(response).toHaveRequestError();
    });
  });

  describe('Patient Portal /me endpoint', () => {
    let authToken;

    beforeAll(async () => {
      // Get auth token for testing protected endpoints
      const loginResponse = await baseApp.post('/api/portal/login').send({
        email: TEST_PATIENT_EMAIL,
      });

      expect(loginResponse).toHaveSucceeded();
      authToken = loginResponse.body.token;
    });

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
    });

    it('Should reject request without authorization header', async () => {
      const response = await baseApp.get('/api/portal/me');
      expect(response).toHaveRequestError();
    });

    it('Should reject request with invalid token', async () => {
      const response = await baseApp
        .get('/api/portal/me')
        .set('Authorization', 'Bearer invalid-token');
      expect(response).toHaveRequestError();
    });

    it('Should reject request with malformed authorization header', async () => {
      const response = await baseApp
        .get('/api/portal/me')
        .set('Authorization', 'InvalidFormat token');
      expect(response).toHaveRequestError();
    });

    it('Should reject request with expired token', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        {
          aud: JWT_TOKEN_TYPES.PATIENT_PORTAL_ACCESS,
          iss: config.canonicalHostName,
          patientUserId: testPatientUser.id,
          jti: 'expired-token',
        },
        config.auth.secret,
        { expiresIn: '-1h' },
      );

      const response = await baseApp
        .get('/api/portal/me')
        .set('Authorization', `Bearer ${expiredToken}`);
      expect(response).toHaveRequestError();
    });
  });

  describe('Patient Portal Route Protection', () => {
    it('Should allow access to login endpoint without authentication', async () => {
      const response = await baseApp.post('/api/portal/login').send({
        email: TEST_PATIENT_EMAIL,
      });
      expect(response).toHaveSucceeded();
    });

    it('Should require authentication for protected endpoints', async () => {
      const response = await baseApp.get('/api/portal/me');
      expect(response).toHaveRequestError();
    });
  });
});
