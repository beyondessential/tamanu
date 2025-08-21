import { addMinutes, subMinutes } from 'date-fns';
import { createHash } from 'crypto';
import { BadAuthenticationError } from '@tamanu/shared/errors';
import { VISIBILITY_STATUSES } from '@tamanu/constants/importable';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';
import { PortalOneTimeTokenService } from '../../app/patientPortal/auth/PortalOneTimeTokenService';

// Helper function to hash tokens (same as in service)
function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

describe('OneTimeTokenService', () => {
  let ctx;
  let store;
  let models;
  let testPortalUser;
  let oneTimeTokenService;

  beforeAll(async () => {
    ctx = await createTestContext();
    store = ctx.store;
    models = store.models;

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

  describe('createForPortalUser', () => {
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
      // The database should store the hashed token, not the plain token
      expect(tokenRecord.token).toEqual(hashToken(result.token));
      expect(tokenRecord.expiresAt).toEqual(result.expiresAt);
    });

    it('should create a token that expires in the configured time', async () => {
      const customExpiryMinutes = 15;
      const customService = new PortalOneTimeTokenService(models, {
        expiryMinutes: customExpiryMinutes,
      });

      const now = new Date();
      const result = await customService.createLoginToken(testPortalUser.id);

      // Verify expiry time is approximately correct (within 1 second tolerance)
      const expectedExpiry = addMinutes(now, customExpiryMinutes);
      const timeDiffInSeconds = Math.abs((result.expiresAt - expectedExpiry) / 1000);

      expect(timeDiffInSeconds).toBeLessThan(1);
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

  describe('verifyAndConsume', () => {
    it('should verify and consume a valid token', async () => {
      // Create a token
      const { token } = await oneTimeTokenService.createLoginToken(testPortalUser.id);

      // Verify hashed token exists in database
      const tokenExists = await models.PortalOneTimeToken.findOne({
        where: { portalUserId: testPortalUser.id, token: hashToken(token) },
      });
      expect(tokenExists).not.toBeNull();

      // Verify and consume the token
      const result = await oneTimeTokenService.verifyAndConsume({
        portalUserId: testPortalUser.id,
        token,
      });

      expect(result).toEqual({ ok: true });

      // Verify token no longer exists
      const tokenAfterConsume = await models.PortalOneTimeToken.findOne({
        where: { portalUserId: testPortalUser.id, token: hashToken(token) },
      });
      expect(tokenAfterConsume).toBeNull();
    });

    it('should throw BadAuthenticationError for invalid token', async () => {
      // Attempt to verify a non-existent token
      await expect(
        oneTimeTokenService.verifyAndConsume({
          portalUserId: testPortalUser.id,
          token: '123456',
        }),
      ).rejects.toThrow(BadAuthenticationError);
    });

    it('should throw BadAuthenticationError for expired token', async () => {
      // Create a token that's already expired
      const expiresAt = subMinutes(new Date(), 5); // 5 minutes in the past

      // Manually create expired token with hashed value
      const token = '123456';
      await models.PortalOneTimeToken.create({
        portalUserId: testPortalUser.id,
        type: 'login',
        token: hashToken(token), // Store the hashed token
        expiresAt,
      });

      // Attempt to verify the expired token
      await expect(
        oneTimeTokenService.verifyAndConsume({
          portalUserId: testPortalUser.id,
          token,
        }),
      ).rejects.toThrow(BadAuthenticationError);
    });

    it('should throw BadAuthenticationError when token belongs to different user', async () => {
      // Create another portal user
      const anotherPatient = await models.Patient.create(
        fake(models.Patient, {
          displayId: 'TEST002',
          firstName: 'Jane',
          lastName: 'Smith',
          sex: 'female',
        }),
      );

      const anotherPortalUser = await models.PortalUser.create({
        email: 'another@test.com',
        patientId: anotherPatient.id,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      // Create a token for the original user
      const { token } = await oneTimeTokenService.createLoginToken(testPortalUser.id);

      // Attempt to verify the token with a different user
      await expect(
        oneTimeTokenService.verifyAndConsume({
          portalUserId: anotherPortalUser.id,
          token,
        }),
      ).rejects.toThrow(BadAuthenticationError);

      // Original token should still exist (check for hashed version)
      const tokenStillExists = await models.PortalOneTimeToken.findOne({
        where: { portalUserId: testPortalUser.id, token: hashToken(token) },
      });
      expect(tokenStillExists).not.toBeNull();
    });
  });
});
