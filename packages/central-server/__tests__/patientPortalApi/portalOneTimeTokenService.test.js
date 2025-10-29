import { addMinutes, subMinutes, differenceInMinutes, parseISO } from 'date-fns';
import { InvalidCredentialError, InvalidTokenError } from '@tamanu/errors';
import { PORTAL_ONE_TIME_TOKEN_TYPES } from '@tamanu/constants';
import { VISIBILITY_STATUSES } from '@tamanu/constants/importable';
import { fake } from '@tamanu/fake-data/fake';
import bcrypt from 'bcrypt';
import { createTestContext } from '../utilities';
import {
  PortalOneTimeTokenService,
  hashPortalToken,
} from '../../app/patientPortalApi/auth/PortalOneTimeTokenService';

describe('PortalOneTimeTokenService', () => {
  let ctx;
  let store;
  let models;
  let testPortalUser;
  let oneTimeTokenService;

  beforeAll(async () => {
    ctx = await createTestContext();
    store = ctx.store;
    models = store.models;

    await models.Setting.set('features.patientPortal', true);

    // Create a test patient
    const testPatient = await models.Patient.create(
      fake(models.Patient, {
        displayId: 'TEST001',
        firstName: 'John',
        lastName: 'Doe',
        sex: 'male',
      }),
    );

    // Create a test portal user
    testPortalUser = await models.PortalUser.create({
      email: 'patient@test.com',
      patientId: testPatient.id,
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    });

    // Initialize the service
    oneTimeTokenService = new PortalOneTimeTokenService(models);
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    // Clean up any existing tokens before each test
    await models.PortalOneTimeToken.destroy({ where: {}, force: true });
  });

  describe('createLoginToken', () => {
    it('should create a one-time token for a portal user', async () => {
      const result = await oneTimeTokenService.createLoginToken(testPortalUser.id);

      // Verify token was created with expected properties
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('expiresAt');

      // Verify token format (6 digits)
      expect(result.token).toMatch(/^\d{6}$/);

      // Verify token exists in database with hashed value
      const tokenRecord = await models.PortalOneTimeToken.findOne({
        where: { portalUserId: testPortalUser.id },
      });

      expect(tokenRecord).not.toBeNull();
      expect(tokenRecord.expiresAt).toEqual(result.expiresAt);
      const verified = await bcrypt.compare(result.token, tokenRecord.token);
      expect(verified).toEqual(true);
    });

    it('should create a token that expires in the configured time', async () => {
      const customService = new PortalOneTimeTokenService(models);

      const now = new Date();
      const result = await customService.createLoginToken(testPortalUser.id);

      // Verify expiry time is correct (to closest minute to avoid false negatives)
      const defaultExpiryTime = 20;
      const expectedExpiry = addMinutes(now, defaultExpiryTime);

      const expiry = parseISO(result.expiresAt);
      expect(Math.abs(differenceInMinutes(expectedExpiry, expiry))).toEqual(0);
    });

    it('should overwrite existing tokens for the same user', async () => {
      // Create first token
      await oneTimeTokenService.createLoginToken(testPortalUser.id);

      // Count tokens
      const initialCount = await models.PortalOneTimeToken.count({
        where: { portalUserId: testPortalUser.id },
      });

      // Create second token
      await oneTimeTokenService.createLoginToken(testPortalUser.id);

      // Count tokens again
      const finalCount = await models.PortalOneTimeToken.count({
        where: { portalUserId: testPortalUser.id },
      });

      // Number of tokens should not change (old one should be replaced)
      expect(finalCount).toEqual(initialCount);
    });
  });

  describe('createRegisterToken', () => {
    it('should create a register token for a portal user', async () => {
      const result = await oneTimeTokenService.createRegisterToken(testPortalUser.id);

      // Verify token was created with expected properties
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('expiresAt');

      // Verify token format (32 hex characters from randomBytes(16))
      expect(result.token).toMatch(/^[0-9a-f]{32}$/);

      // Verify token exists in database with hashed value
      const tokenRecord = await models.PortalOneTimeToken.findOne({
        where: { portalUserId: testPortalUser.id, type: PORTAL_ONE_TIME_TOKEN_TYPES.REGISTER },
      });

      expect(tokenRecord).not.toBeNull();
      // The database should store the hashed token, not the plain token
      expect(tokenRecord.expiresAt).toEqual(result.expiresAt);
      const verified = await bcrypt.compare(result.token, tokenRecord.token);
      expect(verified).toEqual(true);
    });

    it('should create a register token that expires in the configured time', async () => {
      const customService = new PortalOneTimeTokenService(models);

      const now = new Date();
      const result = await customService.createRegisterToken(testPortalUser.id);

      // Verify expiry time is correct (to closest minute to avoid false negatives)
      const defaultExpiryMinutes = 43800;
      const expectedExpiry = addMinutes(now, defaultExpiryMinutes);

      const expiry = parseISO(result.expiresAt);
      expect(Math.abs(differenceInMinutes(expectedExpiry, expiry))).toBe(0);
    });

    it('should overwrite existing register tokens for the same user', async () => {
      // Create first token
      await oneTimeTokenService.createRegisterToken(testPortalUser.id);

      // Count tokens
      const initialCount = await models.PortalOneTimeToken.count({
        where: { portalUserId: testPortalUser.id, type: PORTAL_ONE_TIME_TOKEN_TYPES.REGISTER },
      });

      // Create second token
      await oneTimeTokenService.createRegisterToken(testPortalUser.id);

      // Count tokens again
      const finalCount = await models.PortalOneTimeToken.count({
        where: { portalUserId: testPortalUser.id, type: PORTAL_ONE_TIME_TOKEN_TYPES.REGISTER },
      });

      // Number of tokens should not change (old one should be replaced)
      expect(finalCount).toEqual(initialCount);
    });

    it('should be able to verify and consume a register token', async () => {
      // Create a register token
      const { token } = await oneTimeTokenService.createRegisterToken(testPortalUser.id);

      // Verify and consume the token
      const result = await oneTimeTokenService.verifyAndConsume({
        token,
        type: PORTAL_ONE_TIME_TOKEN_TYPES.REGISTER,
        portalUserId: testPortalUser.id,
      });

      expect(result.id).toEqual(testPortalUser.id);

      // Verify token no longer exists
      const tokenAfterConsume = await models.PortalOneTimeToken.findOne({
        where: { portalUserId: testPortalUser.id, type: PORTAL_ONE_TIME_TOKEN_TYPES.REGISTER },
      });
      expect(tokenAfterConsume).toBeNull();
    });
  });

  describe('verifyAndConsume', () => {
    it('should verify and consume a valid token', async () => {
      // Create a token
      const { token } = await oneTimeTokenService.createLoginToken(testPortalUser.id);

      // Verify hashed token exists in database
      const tokenExists = await models.PortalOneTimeToken.findOne({
        where: { portalUserId: testPortalUser.id },
      });
      expect(tokenExists).not.toBeNull();

      // Verify and consume the token
      const result = await oneTimeTokenService.verifyAndConsume({
        token,
        portalUserId: testPortalUser.id,
      });

      expect(result.id).toEqual(testPortalUser.id);

      // Verify token no longer exists
      const tokenAfterConsume = await models.PortalOneTimeToken.findByPk(tokenExists.id);
      expect(tokenAfterConsume).toBeNull();
    });

    it('should throw InvalidCredentialError for invalid token', async () => {
      // Attempt to verify a non-existent token
      await expect(
        oneTimeTokenService.verifyAndConsume({
          token: '123456',
          portalUserId: testPortalUser.id,
        }),
      ).rejects.toThrow(InvalidCredentialError);
    });

    it('should throw InvalidTokenError for expired token', async () => {
      // Create a token that's already expired
      const expiresAt = subMinutes(new Date(), 5); // 5 minutes in the past

      // Manually create expired token with hashed value
      const token = '123456';
      const hashedToken = await hashPortalToken(token);
      await models.PortalOneTimeToken.create({
        portalUserId: testPortalUser.id,
        type: PORTAL_ONE_TIME_TOKEN_TYPES.LOGIN,
        token: hashedToken,
        expiresAt,
      });

      // Attempt to verify the expired token
      await expect(
        oneTimeTokenService.verifyAndConsume({
          token,
          portalUserId: testPortalUser.id,
        }),
      ).rejects.toThrow(InvalidTokenError);
    });
  });
});
