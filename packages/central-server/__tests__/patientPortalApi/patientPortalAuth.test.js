import config from 'config';
import * as jose from 'jose';

import { JWT_TOKEN_TYPES } from '@tamanu/constants/auth';
import { VISIBILITY_STATUSES } from '@tamanu/constants/importable';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';
import { PortalOneTimeTokenService } from '../../app/patientPortalApi/auth/PortalOneTimeTokenService';
import { getPatientAuthToken } from './patientPortalUtils';

const TEST_PATIENT_EMAIL = 'patient@test.com';

describe('Patient Portal Auth', () => {
  let baseApp;
  let store;
  let close;
  let testPatient;
  let testPortalUser;
  let deactivatedPortalUser;
  let deceasedPatient;
  let deceasedPortalUser;

  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    close = ctx.close;
    store = ctx.store;
    const { Patient, PortalUser, Setting } = store.models;

    await Setting.set('features.patientPortal', true);

    // Create a test patient
    testPatient = await Patient.create(
      fake(Patient, {
        displayId: 'TEST001',
        firstName: 'John',
        lastName: 'Doe',
        sex: 'male',
      }),
    );

    // Create a test portal user
    testPortalUser = await PortalUser.create({
      email: TEST_PATIENT_EMAIL,
      patientId: testPatient.id,
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    });

    // Create a deactivated portal user for testing
    const deactivatedPatient = await Patient.create(
      fake(Patient, {
        portalUserId: testPortalUser.id,
        displayId: 'TEST002',
        firstName: 'Jane',
        lastName: 'Smith',
        sex: 'female',
      }),
    );

    deactivatedPortalUser = await PortalUser.create({
      email: 'deactivated@test.com',
      patientId: deactivatedPatient.id,
      visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
    });

    // Create a deceased patient and portal user
    deceasedPatient = await Patient.create(
      fake(Patient, {
        displayId: 'TEST003',
        firstName: 'Dee',
        lastName: 'Ceased',
        sex: 'female',
        dateOfDeath: new Date().toISOString(),
      }),
    );

    deceasedPortalUser = await PortalUser.create({
      email: 'deceased@test.com',
      patientId: deceasedPatient.id,
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    });
  });

  afterAll(async () => close());

  describe('Patient Portal Login', () => {
    it('Should get a valid access token for correct patient credentials', async () => {
      const oneTimeTokenService = new PortalOneTimeTokenService(store.models);
      const { token } = await oneTimeTokenService.createLoginToken(testPortalUser.id);
      const response = await baseApp.post('/api/portal/login').send({
        loginToken: token,
        email: TEST_PATIENT_EMAIL,
      });

      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('token');

      const contents = jose.decodeJwt(response.body.token);

      expect(contents).toEqual({
        aud: JWT_TOKEN_TYPES.PATIENT_PORTAL_ACCESS,
        iss: config.canonicalHostName,
        portalUserId: expect.any(String),
        jti: expect.any(String),
        iat: expect.any(Number),
        exp: expect.any(Number),
      });
    });

    it('Should reject an empty email', async () => {
      const response = await baseApp.post('/api/portal/request-login-token').send({
        email: '',
      });
      expect(response).toHaveRequestError();
    });

    it('Should return success for a non-existent email and not create a token', async () => {
      const spy = jest.spyOn(PortalOneTimeTokenService.prototype, 'createLoginToken');
      const response = await baseApp.post('/api/portal/request-login-token').send({
        email: 'nonexistent@test.com',
      });
      expect(response).toHaveSucceeded();
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('Should reject login without email', async () => {
      const response = await baseApp.post('/api/portal/request-login-token').send({});
      expect(response).toHaveRequestError();
    });

    it('Should return success for a deactivated portal user and not create a token', async () => {
      const spy = jest.spyOn(PortalOneTimeTokenService.prototype, 'createLoginToken');
      const response = await baseApp.post('/api/portal/request-login-token').send({
        email: deactivatedPortalUser.email,
      });
      expect(response).toHaveSucceeded();
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('Should return success for a deceased patient email and not create a token', async () => {
      const spy = jest.spyOn(PortalOneTimeTokenService.prototype, 'createLoginToken');
      const response = await baseApp.post('/api/portal/request-login-token').send({
        email: deceasedPortalUser.email,
      });
      expect(response).toHaveSucceeded();
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('Should reject login for a deceased patient', async () => {
      const oneTimeTokenService = new PortalOneTimeTokenService(store.models);
      const { token } = await oneTimeTokenService.createLoginToken(deceasedPortalUser.id);
      const response = await baseApp.post('/api/portal/login').send({
        loginToken: token,
        email: deceasedPortalUser.email,
      });
      expect(response).toHaveRequestError();
    });
  });

  describe('Patient Portal /me endpoint', () => {
    let authToken;

    beforeAll(async () => {
      // Get auth token for testing protected endpoints
      authToken = await getPatientAuthToken(baseApp, store.models, TEST_PATIENT_EMAIL);
    });

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
      const expiredToken = await new jose.SignJWT(
        {
          aud: JWT_TOKEN_TYPES.PATIENT_PORTAL_ACCESS,
          iss: config.canonicalHostName,
          portalUserId: testPortalUser.id,
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
      const oneTimeTokenService = new PortalOneTimeTokenService(store.models);
      const { token } = await oneTimeTokenService.createLoginToken(testPortalUser.id);
      const response = await baseApp.post('/api/portal/login').send({
        loginToken: token,
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
