import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';
import { LOGIN_ATTEMPT_OUTCOMES, LOCKED_OUT_ERROR_MESSAGE } from '@tamanu/constants/auth';
import { SETTING_KEYS } from '@tamanu/constants';

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
  let emailService;
  let userId;

  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    close = ctx.close;
    store = ctx.store;
    emailService = ctx.emailService;
    const { Role, User, Facility, Device } = store.models;
    const [, user] = await Promise.all([
      Role.create(fake(Role, { id: TEST_ROLE_ID })),
      ...USERS.map(r => User.create(r)),
      Facility.create(TEST_FACILITY),
    ]);
    userId = user.id;
    await Device.create(
      fake(Device, {
        id: TEST_DEVICE_ID,
        registeredById: user.id,
      }),
    );
  });

  beforeEach(async () => {
    await store.models.OneTimeLogin.destroy({ where: {}, force: true });
  });

  afterAll(async () => close());

  describe('Change password', () => {
    describe('Creating a one-time login', () => {
      it('Should create a one-time login for a password reset request', async () => {
        const response = await baseApp.post('/api/resetPassword').send({
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
        await baseApp.post('/api/resetPassword').send({
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
        const token = crypto.randomUUID();
        const newPassword = crypto.randomUUID();

        await store.models.OneTimeLogin.create({ userId, token, expiresAt: new Date(2077, 1, 1) });

        const response = await baseApp.post('/api/changePassword').send({
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
        const response = await baseApp.post('/api/changePassword').send({
          email: TEST_EMAIL,
          newPassword: crypto.randomUUID(),
          token: crypto.randomUUID(),
        });
        expect(response).not.toHaveSucceeded();
      });

      it('Should reject a password reset if the OTL is consumed', async () => {
        const token = crypto.randomUUID();
        const newPassword = crypto.randomUUID();

        await store.models.OneTimeLogin.create({
          userId,
          token,
          expiresAt: new Date(2077, 1, 1),
          usedAt: new Date(2000, 1, 1),
        });

        const response = await baseApp.post('/api/changePassword').send({
          email: TEST_EMAIL,
          newPassword,
          token,
        });

        expect(response).not.toHaveSucceeded();
      });

      it('Should reject a password reset if the OTL is expired', async () => {
        const token = crypto.randomUUID();
        const newPassword = crypto.randomUUID();

        await store.models.OneTimeLogin.create({
          userId,
          token,
          expiresAt: new Date(2000, 1, 1),
        });

        const response = await baseApp.post('/api/changePassword').send({
          email: TEST_EMAIL,
          newPassword,
          token,
        });

        expect(response).not.toHaveSucceeded();
      });
    });

    describe('Locked out', () => {
      beforeAll(async () => {
        await store.models.Setting.set(SETTING_KEYS.SECURITY_LOGIN_ATTEMPTS, {
          lockoutThreshold: 1,
        });
      });

      beforeEach(async () => {
        await store.models.UserLoginAttempt.destroy({ where: {}, force: true });
      });

      it('Should reject a reset password request if the user is locked out', async () => {
        await store.models.UserLoginAttempt.create({
          userId,
          deviceId: TEST_DEVICE_ID,
          outcome: LOGIN_ATTEMPT_OUTCOMES.LOCKED,
        });

        const response = await baseApp.post('/api/resetPassword').send({
          email: TEST_EMAIL,
          deviceId: TEST_DEVICE_ID,
        });

        const otl = await store.models.OneTimeLogin.findOne({
          include: [
            {
              association: 'user',
              where: { email: TEST_EMAIL },
            },
          ],
        });

        expect(response).not.toHaveSucceeded();
        expect(response.body).toHaveProperty('type', '/problems/rate-limited');
        expect(otl).toBeNull();
        expect(response.body.error).toBeTruthy();
        expect(response.body.error.message).toBe(LOCKED_OUT_ERROR_MESSAGE);
        expect(response.body.error.name).toBe('RateLimitedError');
      });
    });
  });
});
