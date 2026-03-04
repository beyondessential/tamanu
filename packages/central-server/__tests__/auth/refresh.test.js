import bcrypt from 'bcrypt';
import config from 'config';
import * as jose from 'jose';

import { JWT_TOKEN_TYPES } from '@tamanu/constants/auth';
import { VISIBILITY_STATUSES } from '@tamanu/constants/importable';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext, withDateUnsafelyFaked } from '../utilities';

const TEST_EMAIL = 'test@beyondessential.com.au';
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

describe('Auth', () => {
  let baseApp;
  let store;
  let close;

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
  });

  afterAll(async () => close());

  describe('Refresh token', () => {
    it('Should return a new access token with expiresAt for a valid refresh token', async () => {
      const loginResponse = await baseApp.post('/api/login').send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        deviceId: TEST_DEVICE_ID,
      });

      expect(loginResponse).toHaveSucceeded();
      const { token, refreshToken } = loginResponse.body;

      // Make sure that Date used in signing new token is different from global mock date
      const refreshResponse = await withDateUnsafelyFaked(new Date(Date.now() + 10000), () =>
        baseApp.post('/api/refresh').send({
          refreshToken,
          deviceId: TEST_DEVICE_ID,
        }),
      );

      expect(refreshResponse).toHaveSucceeded();
      expect(refreshResponse.body).toHaveProperty('token');

      const oldTokenContents = jose.decodeJwt(token);
      const newTokenContents = jose.decodeJwt(refreshResponse.body.token);

      expect(newTokenContents).toEqual({
        aud: JWT_TOKEN_TYPES.ACCESS,
        jti: expect.any(String),
        iss: config.canonicalHostName,
        userId: expect.any(String),
        deviceId: TEST_DEVICE_ID,
        iat: expect.any(Number),
        exp: expect.any(Number),
      });

      expect(newTokenContents.iat).toBeGreaterThan(oldTokenContents.iat);
      expect(newTokenContents.exp).toBeGreaterThan(oldTokenContents.exp);
    });
    it('Should return a rotated refresh token', async () => {
      const loginResponse = await baseApp.post('/api/login').send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        deviceId: TEST_DEVICE_ID,
      });

      expect(loginResponse).toHaveSucceeded();
      const { refreshToken, user } = loginResponse.body;

      // Make sure that Date used in signing new token is different from global mock date
      const refreshResponse = await withDateUnsafelyFaked(new Date(Date.now() + 10000), () =>
        baseApp.post('/api/refresh').send({
          refreshToken,
          deviceId: TEST_DEVICE_ID,
        }),
      );

      expect(refreshResponse).toHaveSucceeded();
      expect(refreshResponse.body).toHaveProperty('refreshToken');

      const newRefreshTokenContents = jose.decodeJwt(refreshResponse.body.refreshToken);
      const oldRefreshTokenContents = jose.decodeJwt(refreshToken);

      expect(newRefreshTokenContents).toEqual({
        aud: JWT_TOKEN_TYPES.REFRESH,
        jti: expect.any(String),
        iss: config.canonicalHostName,
        userId: expect.any(String),
        refreshId: expect.any(String),
        iat: expect.any(Number),
        exp: expect.any(Number),
      });

      expect(newRefreshTokenContents.iat).toBeGreaterThan(oldRefreshTokenContents.iat);
      expect(newRefreshTokenContents.exp).toBeGreaterThan(oldRefreshTokenContents.exp);

      const refreshTokenRecord = await store.models.RefreshToken.findOne({
        where: { deviceId: TEST_DEVICE_ID, userId: user.id },
      });
      expect(refreshTokenRecord).not.toBeNull();
      expect(refreshTokenRecord).toHaveProperty('refreshId');
      await expect(
        bcrypt.compare(newRefreshTokenContents.refreshId, refreshTokenRecord.refreshId),
      ).resolves.toBe(true);
    });
    it('Should reject if external client', async () => {
      const loginResponse = await baseApp.post('/api/login').send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        deviceId: TEST_DEVICE_ID,
      });
      expect(loginResponse).toHaveSucceeded();
      const refreshResponse = await baseApp
        .post('/api/refresh')
        .set('X-Tamanu-Client', 'FHIR')
        .send({
          refreshToken: loginResponse.refreshToken,
          deviceId: TEST_DEVICE_ID,
        });
      expect(refreshResponse).toHaveRequestError();
    });
    it('Should reject invalid refresh token', async () => {
      const loginResponse = await baseApp.post('/api/login').send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        deviceId: TEST_DEVICE_ID,
      });
      expect(loginResponse).toHaveSucceeded();

      const refreshResponse = await baseApp.post('/api/refresh').send({
        refreshToken: 'invalid-token',
        deviceId: TEST_DEVICE_ID,
      });
      expect(refreshResponse).toHaveRequestError();
    });
    it('Should fail if refresh token requested with a token with aud not of refresh', async () => {
      const loginResponse = await baseApp.post('/api/login').send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        deviceId: TEST_DEVICE_ID,
      });
      expect(loginResponse).toHaveSucceeded();

      const { token } = loginResponse.body;

      const refreshResponse = await baseApp.post('/api/refresh').send({
        // Incorrectly send token instead
        refreshToken: token,
        deviceId: TEST_DEVICE_ID,
      });
      expect(refreshResponse).toHaveRequestError();
    });
    it('Should fail if refresh token requested from different device', async () => {
      const loginResponse = await baseApp.post('/api/login').send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        deviceId: TEST_DEVICE_ID,
      });
      expect(loginResponse).toHaveSucceeded();

      const { refreshToken } = loginResponse.body;

      const refreshResponse = await baseApp.post('/api/refresh').send({
        refreshToken,
        deviceId: 'different-device',
      });
      expect(refreshResponse).toHaveRequestError();
    });

    it('Should fail if refresh token requested from deactivated user', async () => {
      const freshUser = await store.models.User.create(
        fake(store.models.User, {
          password: TEST_PASSWORD,
        }),
      );
      const loginResponse = await baseApp.post('/api/login').send({
        email: freshUser.email,
        password: TEST_PASSWORD,
        deviceId: TEST_DEVICE_ID,
      });
      expect(loginResponse).toHaveSucceeded();
      const { refreshToken } = loginResponse.body;

      await freshUser.update({
        visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
      });

      const refreshResponse = await baseApp.post('/api/refresh').send({
        refreshToken,
        deviceId: TEST_DEVICE_ID,
      });
      expect(refreshResponse).toHaveRequestError();
    });
  });
});
