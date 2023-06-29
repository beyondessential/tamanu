import { v4 as uuid } from 'uuid';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from 'config';
import { createTestContext, withDate } from '../utilities';
import { JWT_TOKEN_TYPES } from 'shared/constants/auth';

const TEST_EMAIL = 'test@beyondessential.com.au';
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
];

describe('Auth', () => {
  let baseApp;
  let app;
  let store;
  let close;
  let emailService;
  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    close = ctx.close;
    store = ctx.store;
    emailService = ctx.emailService;
    app = await baseApp.asRole('practitioner');

    await Promise.all([
      ...USERS.map(r => ctx.store.models.User.create(r)),
      ctx.store.models.Facility.create(TEST_FACILITY),
    ]);
  });

  afterAll(async () => close());

  describe('Logging in', () => {
    it('Should get a valid access token for correct credentials', async () => {
      const response = await baseApp.post('/v1/login').send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        deviceId: TEST_DEVICE_ID,
      });

      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('token');
      const contents = jwt.decode(response.body.token);

      expect(contents).toEqual({
        aud: JWT_TOKEN_TYPES.ACCESS,
        iss: config.canonicalHostName,
        userId: expect.any(String),
        deviceId: TEST_DEVICE_ID,
        jti: expect.any(String),
        iat: expect.any(Number),
        exp: expect.any(Number),
      });
    });

    it('Should issue a refresh token and save hashed refreshId to the database', async () => {
      const response = await baseApp.post('/v1/login').send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        deviceId: TEST_DEVICE_ID,
      });
      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('refreshToken');

      const { refreshToken, user } = response.body;

      const contents = jwt.decode(refreshToken);

      expect(contents).toEqual({
        aud: JWT_TOKEN_TYPES.REFRESH,
        iss: config.canonicalHostName,
        userId: expect.any(String),
        refreshId: expect.any(String),
        jti: expect.any(String),
        iat: expect.any(Number),
        exp: expect.any(Number),
      });

      const refreshTokenRecord = await store.models.RefreshToken.findOne({
        where: { deviceId: TEST_DEVICE_ID, userId: user.id },
      });
      expect(refreshTokenRecord).not.toBeNull();
      expect(refreshTokenRecord).toHaveProperty('refreshId');
      expect(bcrypt.compare(contents.refreshId, refreshTokenRecord.refreshId)).resolves.toBe(true);
    });

    it('Should not issue a refresh token for external client', async () => {
      const response = await baseApp
        .post('/v1/login')
        .set({ 'X-Tamanu-Client': 'FHIR' })
        .send({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        });
      expect(response).toHaveSucceeded();
      expect(response.body.refreshToken).toBeUndefined();
    });

    it('Should respond with user details with correct credentials', async () => {
      const response = await baseApp.post('/v1/login').send({
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

    it('Should return feature flags in the login response', async () => {
      const response = await baseApp.post('/v1/login').send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        deviceId: TEST_DEVICE_ID,
      });

      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('localisation.fields.displayId', {
        shortLabel: 'NHN',
        longLabel: 'National Health Number',
        pattern: '[\\s\\S]*',
      });
    });

    it('Should reject an empty credential', async () => {
      const response = await baseApp.post('/v1/login').send({
        email: TEST_EMAIL,
        password: '',
        deviceId: TEST_DEVICE_ID,
      });
      expect(response).toHaveRequestError();
    });

    it('Should reject an incorrect password', async () => {
      const response = await baseApp.post('/v1/login').send({
        email: TEST_EMAIL,
        password: 'not the password',
        deviceId: TEST_DEVICE_ID,
      });
      expect(response).toHaveRequestError();
    });
  });

  describe('Refresh token', () => {
    it('Should return a new access token with expiresAt for a valid refresh token', async () => {
      const loginResponse = await baseApp.post('/v1/login').send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        deviceId: TEST_DEVICE_ID,
      });

      expect(loginResponse).toHaveSucceeded();
      const { token, refreshToken } = loginResponse.body;

      // Make sure that Date used in signing new token is different from global mock date
      const refreshResponse = await withDate(new Date(Date.now() + 10000), () =>
        baseApp.post('/v1/refresh').send({
          refreshToken,
          deviceId: TEST_DEVICE_ID,
        }),
      );

      expect(refreshResponse).toHaveSucceeded();
      expect(refreshResponse.body).toHaveProperty('token');

      const oldTokenContents = jwt.decode(token);
      const newTokenContents = jwt.decode(refreshResponse.body.token);

      expect(newTokenContents).toEqual({
        aud: JWT_TOKEN_TYPES.ACCESS,
        iss: config.canonicalHostName,
        userId: expect.any(String),
        deviceId: TEST_DEVICE_ID,
        jti: expect.any(String),
        iat: expect.any(Number),
        exp: expect.any(Number),
      });

      expect(newTokenContents.jti).not.toEqual(oldTokenContents.jti);
      expect(newTokenContents.iat).toBeGreaterThan(oldTokenContents.iat);
      expect(newTokenContents.exp).toBeGreaterThan(oldTokenContents.exp);
    });
    it('Should return a rotated refresh token', async () => {
      const loginResponse = await baseApp.post('/v1/login').send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        deviceId: TEST_DEVICE_ID,
      });

      expect(loginResponse).toHaveSucceeded();
      const { refreshToken, user } = loginResponse.body;

      // Make sure that Date used in signing new token is different from global mock date
      const refreshResponse = await withDate(new Date(Date.now() + 10000), () =>
        baseApp.post('/v1/refresh').send({
          refreshToken,
          deviceId: TEST_DEVICE_ID,
        }),
      );

      expect(refreshResponse).toHaveSucceeded();
      expect(refreshResponse.body).toHaveProperty('refreshToken');

      const newRefreshTokenContents = jwt.decode(refreshResponse.body.refreshToken);
      const oldRefreshTokenContents = jwt.decode(refreshToken);

      expect(newRefreshTokenContents).toEqual({
        aud: JWT_TOKEN_TYPES.REFRESH,
        iss: config.canonicalHostName,
        userId: expect.any(String),
        refreshId: expect.any(String),
        jti: expect.any(String),
        iat: expect.any(Number),
        exp: expect.any(Number),
      });

      expect(newRefreshTokenContents.jti).not.toEqual(oldRefreshTokenContents.jti);
      expect(newRefreshTokenContents.iat).toBeGreaterThan(oldRefreshTokenContents.iat);
      expect(newRefreshTokenContents.exp).toBeGreaterThan(oldRefreshTokenContents.exp);

      const refreshTokenRecord = await store.models.RefreshToken.findOne({
        where: { deviceId: TEST_DEVICE_ID, userId: user.id },
      });
      expect(refreshTokenRecord).not.toBeNull();
      expect(refreshTokenRecord).toHaveProperty('refreshId');
      expect(
        bcrypt.compare(newRefreshTokenContents.refreshId, refreshTokenRecord.refreshId),
      ).resolves.toBe(true);
    });
    it('Should reject if external client', async () => {
      const loginResponse = await baseApp.post('/v1/login').send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        deviceId: TEST_DEVICE_ID,
      });
      expect(loginResponse).toHaveSucceeded();
      const refreshResponse = await baseApp
        .post('/v1/refresh')
        .set('X-Tamanu-Client', 'FHIR')
        .send({
          refreshToken: loginResponse.refreshToken,
          deviceId: TEST_DEVICE_ID,
        });
      expect(refreshResponse).toHaveRequestError();
    });
    it('Should reject invalid refresh token', async () => {
      const loginResponse = await baseApp.post('/v1/login').send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        deviceId: TEST_DEVICE_ID,
      });
      expect(loginResponse).toHaveSucceeded();

      const refreshResponse = await baseApp.post('/v1/refresh').send({
        refreshToken: 'invalid-token',
        deviceId: TEST_DEVICE_ID,
      });
      expect(refreshResponse).toHaveRequestError();
    });
    it('Should fail if refresh token requested with a token with aud not of refresh', async () => {
      const loginResponse = await baseApp.post('/v1/login').send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        deviceId: TEST_DEVICE_ID,
      });
      expect(loginResponse).toHaveSucceeded();

      const { token } = loginResponse.body;

      const refreshResponse = await baseApp.post('/v1/refresh').send({
        // Incorrectly send token instead
        refreshToken: token,
        deviceId: TEST_DEVICE_ID,
      });
      expect(refreshResponse).toHaveRequestError();
    });
    it('Should fail if refresh token requested from different device', async () => {
      const loginResponse = await baseApp.post('/v1/login').send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        deviceId: TEST_DEVICE_ID,
      });
      expect(loginResponse).toHaveSucceeded();

      const { refreshToken } = loginResponse.body;

      const refreshResponse = await baseApp.post('/v1/refresh').send({
        refreshToken,
        deviceId: 'different-device',
      });
      expect(refreshResponse).toHaveRequestError();
    });
  });

  describe('User management', () => {
    test.todo('Should prevent user creation without appropriate permission');
    test.todo('Should prevent password change without appropriate permission');
  });

  it('Should answer a whoami request correctly', async () => {
    // first, log in and get token
    const response = await baseApp.post('/v1/login').send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      deviceId: TEST_DEVICE_ID,
    });

    expect(response).toHaveSucceeded();
    const { token } = response.body;

    // then run the whoami request
    const whoamiResponse = await baseApp.get('/v1/whoami').set('Authorization', `Bearer ${token}`);
    expect(whoamiResponse).toHaveSucceeded();

    const { body } = whoamiResponse;
    expect(body).toHaveProperty('email', TEST_EMAIL);
    expect(body).not.toHaveProperty('password');
    expect(body).not.toHaveProperty('hashedPassword');
  });

  it('Should send permissions alongside login information', async () => {
    const response = await baseApp.post('/v1/login').send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      deviceId: TEST_DEVICE_ID,
    });

    expect(response).toHaveSucceeded();
    expect(response.body).toHaveProperty('permissions');
  });

  describe('Change password', () => {
    describe('Creating a one-time login', () => {
      it('Should create a one-time login for a password reset request', async () => {
        const response = await baseApp.post('/v1/resetPassword').send({
          email: TEST_EMAIL,
        });

        const otl = await store.models.OneTimeLogin.findOne({
          include: [
            {
              association: 'user',
              where: { email: TEST_EMAIL },
            },
          ],
        });

        expect(response).toHaveSucceeded();
        expect(otl).toHaveProperty('token', expect.any(String));
        expect(otl).toHaveProperty('user.email', TEST_EMAIL);
      });

      it('Should email the user a one-time login', async () => {
        await baseApp.post('/v1/resetPassword').send({
          email: TEST_EMAIL,
        });
        const email = emailService.sendEmail.mock.calls[0][0].text;
        const token = email.match(/Reset Code: (.*)\n/)[1];
        expect(token).toEqual(expect.any(String));
      });
    });

    describe('Consuming a one-time login', () => {
      let userId;
      beforeAll(async () => {
        const user = await store.models.User.findOne({
          where: { email: TEST_EMAIL },
        });
        userId = user.id;
      });

      it('Should consume a one-time login and reset a password', async () => {
        const token = uuid();
        const newPassword = uuid();

        await store.models.OneTimeLogin.create({ userId, token, expiresAt: new Date(2077, 1, 1) });

        const response = await baseApp.post('/v1/changePassword').send({
          email: TEST_EMAIL,
          newPassword,
          token,
        });

        // expect a successful response
        expect(response).toHaveSucceeded();

        // expect a matching hashed password
        const dbUser = await store.models.User.scope('withPassword').findByPk(userId);
        const user = dbUser.get({ plain: true });
        expect(user).toHaveProperty('password', expect.any(String));
        expect(await bcrypt.compare(newPassword, user.password)).toEqual(true);

        // expect the token to be used
        const dbOtl = await store.models.OneTimeLogin.findOne({ where: { token } });
        const otl = dbOtl.get({ plain: true });
        expect(otl).toHaveProperty('usedAt', expect.any(Date));
      });

      it('Should reject a password reset if no one-time login exists', async () => {
        const response = await baseApp.post('/v1/changePassword').send({
          email: TEST_EMAIL,
          newPassword: uuid(),
          token: uuid(),
        });
        expect(response).not.toHaveSucceeded();
      });

      it('Should reject a password reset if the OTL is consumed', async () => {
        const token = uuid();
        const newPassword = uuid();

        await store.models.OneTimeLogin.create({
          userId,
          token,
          expiresAt: new Date(2077, 1, 1),
          usedAt: new Date(2000, 1, 1),
        });

        const response = await baseApp.post('/v1/changePassword').send({
          email: TEST_EMAIL,
          newPassword,
          token,
        });

        expect(response).not.toHaveSucceeded();
      });

      it('Should reject a password reset if the OTL is expired', async () => {
        const token = uuid();
        const newPassword = uuid();

        await store.models.OneTimeLogin.create({
          userId,
          token,
          expiresAt: new Date(2000, 1, 1),
        });

        const response = await baseApp.post('/v1/changePassword').send({
          email: TEST_EMAIL,
          newPassword,
          token,
        });

        expect(response).not.toHaveSucceeded();
      });
    });
  });
});
