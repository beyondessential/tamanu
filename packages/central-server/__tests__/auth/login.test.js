import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import bcrypt from 'bcrypt';
import config from 'config';
import * as jose from 'jose';

import { JWT_TOKEN_TYPES, LOGIN_ATTEMPT_OUTCOMES } from '@tamanu/constants/auth';
import { SERVER_TYPES, SETTING_KEYS, VERSION_COMPATIBILITY_ERRORS } from '@tamanu/constants';
import { VISIBILITY_STATUSES } from '@tamanu/constants/importable';
import { disableHardcodedPermissionsForSuite } from '@tamanu/shared/test-helpers';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';

const TEST_EMAIL = 'test@bes.au';
const TEST_ROLE_EMAIL = 'testrole@bes.au';
const TEST_ROLE_ID = 'test-role-id';
const TEST_PASSWORD = '1Q2Q3Q4Q';
const TEST_DEVICE_ID = 'test-device-id';
const TEST_FACILITY = {
  id: 'testfacilityid',
  code: 'testfacilitycode',
  name: 'Test Facility',
};

const USERS = [
  {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    displayName: 'Test Beyond',
  },
  {
    email: TEST_ROLE_EMAIL,
    password: TEST_PASSWORD,
    displayName: 'Role Test BES',
    role: TEST_ROLE_ID,
  },
];

describe('Auth - Login', () => {
  let baseApp;
  let store;
  let close;
  let deactivatedUser;

  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    close = ctx.close;
    store = ctx.store;
    const { Role, User, Facility, Device } = store.models;
    const [, user] = await Promise.all([
      Role.create(fake(Role, { id: TEST_ROLE_ID })),
      ...USERS.map(r => User.create(r)),
      Facility.create(TEST_FACILITY),
    ]);
    await Device.create({
      id: TEST_DEVICE_ID,
      registeredById: user.id,
    });
    deactivatedUser = await User.create(
      fake(User, {
        password: TEST_PASSWORD,
        visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
      }),
    );
  });

  afterAll(async () => close());

  describe('Login with db-defined permissions', () => {
    disableHardcodedPermissionsForSuite();

    it('should include role in the data returned by a successful login', async () => {
      const result = await baseApp.post('/api/login').send({
        email: TEST_ROLE_EMAIL,
        password: TEST_PASSWORD,
        deviceId: TEST_DEVICE_ID,
      });
      expect(result).toHaveSucceeded();
      expect(result.body.role).toMatchObject({
        id: TEST_ROLE_ID,
      });
    });
  });

  describe('Logging in', () => {
    it('Should get a valid access token for correct credentials', async () => {
      const response = await baseApp.post('/api/login').send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        deviceId: TEST_DEVICE_ID,
      });

      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('token');
      const contents = jose.decodeJwt(response.body.token);

      expect(contents).toEqual({
        aud: JWT_TOKEN_TYPES.ACCESS,
        jti: expect.any(String),
        iss: config.canonicalHostName,
        userId: expect.any(String),
        deviceId: TEST_DEVICE_ID,
        iat: expect.any(Number),
        exp: expect.any(Number),
      });
    });

    it('Should issue a refresh token and save hashed refreshId to the database', async () => {
      const response = await baseApp.post('/api/login').send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        deviceId: TEST_DEVICE_ID,
      });
      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('refreshToken');

      const { refreshToken, user } = response.body;

      const contents = jose.decodeJwt(refreshToken);

      expect(contents).toEqual({
        aud: JWT_TOKEN_TYPES.REFRESH,
        jti: expect.any(String),
        iss: config.canonicalHostName,
        userId: expect.any(String),
        refreshId: expect.any(String),
        iat: expect.any(Number),
        exp: expect.any(Number),
      });

      const refreshTokenRecord = await store.models.RefreshToken.findOne({
        where: { deviceId: TEST_DEVICE_ID, userId: user.id },
      });
      expect(refreshTokenRecord).not.toBeNull();
      expect(refreshTokenRecord).toHaveProperty('refreshId');
      await expect(bcrypt.compare(contents.refreshId, refreshTokenRecord.refreshId)).resolves.toBe(
        true,
      );
    });

    it('Should not issue a refresh token for external client', async () => {
      const response = await baseApp.post('/api/login').set({ 'X-Tamanu-Client': 'FHIR' }).send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });
      expect(response).toHaveSucceeded();
      expect(response.body.refreshToken).toBeUndefined();
    });

    it('Should respond with user details with correct credentials', async () => {
      const response = await baseApp.post('/api/login').send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        deviceId: TEST_DEVICE_ID,
      });

      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('user.id');
      expect(response.body).toHaveProperty('user.email', TEST_EMAIL);
      expect(response.body).toHaveProperty('user.displayName');

      expect(response.body).not.toHaveProperty('user.password');
      expect(response.body).not.toHaveProperty('user.hashedPassword');
    });

    it('Should return localised field settings in the login response', async () => {
      const response = await baseApp.post('/api/login').send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        deviceId: TEST_DEVICE_ID,
      });

      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty(
        'settings.fields.displayId',
        expect.objectContaining({ pattern: '[\\s\\S]*' }),
      );
    });

    it('Should reject an empty credential', async () => {
      const response = await baseApp.post('/api/login').send({
        email: TEST_EMAIL,
        password: '',
        deviceId: TEST_DEVICE_ID,
      });
      expect(response).toHaveRequestError();
    });

    it('Should reject an incorrect password', async () => {
      const response = await baseApp.post('/api/login').send({
        email: TEST_EMAIL,
        password: 'not the password',
        deviceId: TEST_DEVICE_ID,
      });
      expect(response).toHaveRequestError();
    });

    it('Should reject a deactivated user', async () => {
      const response = await baseApp.post('/api/login').send({
        email: deactivatedUser.email,
        password: TEST_PASSWORD,
        deviceId: TEST_DEVICE_ID,
      });
      expect(response).toHaveRequestError();
    });
  });

  describe('Client version', () => {
    const login = (client, version) =>
      baseApp
        .post('/api/login')
        .set({ 'X-Tamanu-Client': client, 'X-Version': version })
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD, deviceId: TEST_DEVICE_ID });

    const errorMessage = response => JSON.parse(response.error.text).error.message;

    it('Should let an out-of-date mobile app log in, so it can update while staff work', async () => {
      const response = await login(SERVER_TYPES.MOBILE, '0.0.1');
      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('token');
    });

    it('Should still reject the same out-of-date mobile app beyond login', async () => {
      const response = await baseApp.get('/').set({
        'X-Tamanu-Client': SERVER_TYPES.MOBILE,
        'X-Version': '0.0.1',
      });
      expect(response).not.toHaveSucceeded();
      expect(errorMessage(response)).toEqual(VERSION_COMPATIBILITY_ERRORS.LOW);
    });

    it('Should still reject a mobile app above the maximum at login', async () => {
      const response = await login(SERVER_TYPES.MOBILE, '999.0.0');
      expect(response).not.toHaveSucceeded();
      expect(errorMessage(response)).toEqual(VERSION_COMPATIBILITY_ERRORS.HIGH);
    });

    it('Should still reject other out-of-date clients at login', async () => {
      const response = await login(SERVER_TYPES.FACILITY, '0.0.1');
      expect(response).not.toHaveSucceeded();
      expect(errorMessage(response)).toEqual(VERSION_COMPATIBILITY_ERRORS.LOW);
    });
  });

  describe('Locked out', () => {
    let userId;
    beforeAll(async () => {
      await store.models.Setting.set(SETTING_KEYS.SECURITY_LOGIN_ATTEMPTS, {
        lockoutThreshold: 2,
      });
      const user = await store.models.User.findOne({
        where: {
          email: TEST_EMAIL,
        },
      });
      userId = user.id;
    });
    beforeEach(async () => {
      await store.models.UserLoginAttempt.destroy({ where: {}, force: true });
    });

    it('Should create a successful login attempt', async () => {
      const response = await baseApp.post('/api/login').send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        deviceId: TEST_DEVICE_ID,
      });
      const loginAttempt = await store.models.UserLoginAttempt.findOne({
        where: {
          userId,
          deviceId: TEST_DEVICE_ID,
        },
      });
      expect(response).toHaveSucceeded();
      expect(loginAttempt).toHaveProperty('outcome', LOGIN_ATTEMPT_OUTCOMES.SUCCEEDED);
    });

    it('Should create a failed login attempt', async () => {
      const response = await baseApp.post('/api/login').send({
        email: TEST_EMAIL,
        password: 'wrong',
        deviceId: TEST_DEVICE_ID,
      });
      const loginAttempt = await store.models.UserLoginAttempt.findOne({
        where: {
          userId,
          deviceId: TEST_DEVICE_ID,
        },
      });
      expect(response).toHaveRequestError();
      expect(loginAttempt).toHaveProperty('outcome', LOGIN_ATTEMPT_OUTCOMES.FAILED);
    });

    it('Should lock out a user after the lockout threshold is reached', async () => {
      await store.models.UserLoginAttempt.create({
        userId,
        deviceId: TEST_DEVICE_ID,
        outcome: LOGIN_ATTEMPT_OUTCOMES.FAILED,
      });
      const response = await baseApp.post('/api/login').send({
        email: TEST_EMAIL,
        password: 'wrong',
        deviceId: TEST_DEVICE_ID,
      });
      const loginAttempt = await store.models.UserLoginAttempt.findOne({
        where: {
          userId,
          deviceId: TEST_DEVICE_ID,
        },
        order: [['createdAt', 'DESC']],
      });
      expect(response).toHaveRequestError();
      expect(loginAttempt).toHaveProperty('outcome', LOGIN_ATTEMPT_OUTCOMES.LOCKED);
    });

    it('Should reject a locked out user', async () => {
      await store.models.UserLoginAttempt.create({
        userId,
        deviceId: TEST_DEVICE_ID,
        outcome: LOGIN_ATTEMPT_OUTCOMES.LOCKED,
      });
      const response = await baseApp.post('/api/login').send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        deviceId: TEST_DEVICE_ID,
      });
      expect(response).toHaveRequestError();
    });
  });
});
