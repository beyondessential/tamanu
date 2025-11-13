import { Sequelize } from 'sequelize';
import { SETTING_KEYS, LOGIN_ATTEMPT_OUTCOMES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';

describe('UserLoginAttempt', () => {
  const deviceId = 'lockout-test-device-id';
  let ctx;
  let models;
  let settings;
  let userId;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    settings = ctx.settings;
    const user = await models.User.create(fake(models.User, {
      email: 'lockout-test@test.com',
      password: 'lockout',
      role: 'practitioner',
    }));
    userId = user.id;
    await models.Setting.set(SETTING_KEYS.SECURITY_LOGIN_ATTEMPTS, {
      lockoutDuration: 1,
      lockoutThreshold: 2,
      observationWindow: 1,
    });
    await models.Device.create(fake(models.Device, {
      id: deviceId,
      registeredById: userId,
    }));
  });

  beforeEach(async () => {
    await models.UserLoginAttempt.destroy({ where: {}, force: true });
  });

  afterAll(async () => ctx.close());

  describe('checkIsUserLockedOut', () => {
    it('should return false if the user has no locked login attempts', async () => {
      const { isUserLockedOut } = await models.UserLoginAttempt.checkIsUserLockedOut({
        settings,
        userId,
        deviceId,
      });
      expect(isUserLockedOut).toBe(false);
    });

    it('should return false if the lockoutDuration has passed', async () => {
      await models.UserLoginAttempt.create({
        userId,
        deviceId,
        outcome: LOGIN_ATTEMPT_OUTCOMES.LOCKED,
        createdAt: Sequelize.literal("CURRENT_TIMESTAMP - interval '3 minutes'"),
      });
      const { isUserLockedOut } = await models.UserLoginAttempt.checkIsUserLockedOut({
        settings,
        userId,
        deviceId,
      });
      expect(isUserLockedOut).toBe(false);
    });

    it('should return true if the user had a locked login attempt in the last lockoutDuration minutes', async () => {
      await models.UserLoginAttempt.create({
        userId,
        deviceId,
        outcome: LOGIN_ATTEMPT_OUTCOMES.LOCKED,
      });
      const { isUserLockedOut } = await models.UserLoginAttempt.checkIsUserLockedOut({
        settings,
        userId,
        deviceId,
      });
      expect(isUserLockedOut).toBe(true);
    });
  });

  describe('createFailedLoginAttempt', () => {
    it('should create a failed login attempt if the user has failed less than the lockoutThreshold login attempts in the last observationWindow minutes', async () => {
      await models.UserLoginAttempt.create({
        userId,
        deviceId,
        outcome: LOGIN_ATTEMPT_OUTCOMES.FAILED,
        createdAt: Sequelize.literal("CURRENT_TIMESTAMP - interval '3 minutes'"),
      });
      const { loginAttempt } = await models.UserLoginAttempt.createFailedLoginAttempt({
        settings,
        userId,
        deviceId,
      });
      expect(loginAttempt.outcome).toBe(LOGIN_ATTEMPT_OUTCOMES.FAILED);
    });

    it('should create a locked login attempt if the user has failed more than the lockoutThreshold login attempts in the last observationWindow minutes', async () => {
      await models.UserLoginAttempt.create({
        userId,
        deviceId,
        outcome: LOGIN_ATTEMPT_OUTCOMES.FAILED,
      });
      const { loginAttempt } = await models.UserLoginAttempt.createFailedLoginAttempt({
        settings,
        userId,
        deviceId,
      });
      expect(loginAttempt.outcome).toBe(LOGIN_ATTEMPT_OUTCOMES.LOCKED);
    });
  });
});
