import { JWT_KEY_ALG, JWT_KEY_ID, JWT_TOKEN_TYPES } from '@tamanu/constants';
import * as jose from 'jose';
import config from 'config';
import { createTestContext } from '../utilities';

describe('JWT Token Validation', () => {
  let ctx;
  let models;
  let baseApp;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;
  });

  afterAll(async () => {
    await ctx.close();
  });

  describe('JWT Token Structure', () => {
    it('Should create JWT tokens with correct payload structure', async () => {
      const { buildToken } = require('../../dist/auth/utils');
      const { User } = models;

      // Create a test user
      const user = await User.create({
        email: 'jwt-test@example.com',
        displayName: 'JWT Test User',
        role: 'admin',
        password: 'password123',
      });

      // Create a token
      const token = await buildToken({ userId: user.id }, null, {
        expiresIn: '1d',
        audience: JWT_TOKEN_TYPES.ACCESS,
        issuer: config.canonicalHostName,
      });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts

      // Decode token and verify structure
      const decoded = jose.decodeJwt(token);
      expect(decoded).toMatchObject({
        userId: user.id,
        aud: JWT_TOKEN_TYPES.ACCESS,
        iss: config.canonicalHostName,
        iat: expect.any(Number),
        exp: expect.any(Number),
      });

      // Verify userId is a non-empty string
      expect(typeof decoded.userId).toBe('string');
      expect(decoded.userId.length).toBeGreaterThan(0);
    });

    it('Should create JWT tokens with optional deviceId and facilityId', async () => {
      const { buildToken } = require('../../dist/auth/utils');
      const { User, Device, Facility } = models;

      const user = await User.create({
        email: 'jwt-device-test@example.com',
        displayName: 'JWT Device Test User',
        role: 'admin',
        password: 'password123',
      });

      const device = await Device.create({
        name: 'Test Device',
        establishedAt: new Date(),
        registeredById: user.id,
      });

      const facility = await Facility.create({
        code: 'TEST_FAC',
        name: 'Test Facility',
      });

      // Create token with deviceId and facilityId
      const token = await buildToken(
        {
          userId: user.id,
          deviceId: device.id,
          facilityId: facility.id,
        },
        null,
        {
          expiresIn: '1d',
          audience: JWT_TOKEN_TYPES.ACCESS,
          issuer: config.canonicalHostName,
        },
      );

      const decoded = jose.decodeJwt(token);
      expect(decoded).toMatchObject({
        userId: user.id,
        deviceId: device.id,
        facilityId: facility.id,
        aud: JWT_TOKEN_TYPES.ACCESS,
        iss: config.canonicalHostName,
      });
    });
  });

  describe('JWT Token Verification', () => {
    it('Should correctly verify JWT tokens using User.loginFromToken', async () => {
      const { buildToken } = require('../../dist/auth/utils');
      const { User } = models;

      const user = await User.create({
        email: 'jwt-verify-test@example.com',
        displayName: 'JWT Verify Test User',
        role: 'practitioner',
        password: 'password123',
      });

      const token = await buildToken({ userId: user.id }, null, {
        expiresIn: '1d',
        audience: JWT_TOKEN_TYPES.ACCESS,
        issuer: config.canonicalHostName,
      });

      // Test direct token verification
      const result = await User.loginFromToken(token, {
        tokenSecret: config.auth.secret,
        tokenIssuer: config.canonicalHostName,
      });

      expect(result).toMatchObject({
        token,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
        },
        device: undefined,
        facility: undefined,
      });
    });

    it('Should handle JWT tokens with deviceId correctly', async () => {
      const { buildToken } = require('../../dist/auth/utils');
      const { User, Device } = models;

      const user = await User.create({
        email: 'jwt-device-verify@example.com',
        displayName: 'JWT Device Verify User',
        role: 'admin',
        password: 'password123',
      });

      const device = await Device.create({
        name: 'Verify Test Device',
        establishedAt: new Date(),
        registeredById: user.id,
      });

      const token = await buildToken({ userId: user.id, deviceId: device.id }, null, {
        expiresIn: '1d',
        audience: JWT_TOKEN_TYPES.ACCESS,
        issuer: config.canonicalHostName,
      });

      const result = await User.loginFromToken(token, {
        tokenSecret: config.auth.secret,
        tokenIssuer: config.canonicalHostName,
      });

      expect(result.device).toBeDefined();
      expect(result.device.id).toBe(device.id);
    });

    it('Should reject JWT tokens with invalid payload structure', async () => {
      const { User } = models;

      // Create a token with invalid payload (missing userId)
      const invalidToken = await new jose.SignJWT({ invalidField: 'test' })
        .setProtectedHeader({ alg: JWT_KEY_ALG, kid: JWT_KEY_ID })
        .setIssuedAt()
        .setIssuer(config.canonicalHostName)
        .setAudience(JWT_TOKEN_TYPES.ACCESS)
        .setExpirationTime('1d')
        .sign(new TextEncoder().encode(config.auth.secret));

      await expect(
        User.loginFromToken(invalidToken, {
          tokenSecret: config.auth.secret,
          tokenIssuer: config.canonicalHostName,
        }),
      ).rejects.toThrow('Invalid token payload');
    });

    it('Should reject JWT tokens with non-existent userId', async () => {
      const { buildToken } = require('../../dist/auth/utils');
      const { User } = models;

      const fakeUserId = '99999999-9999-9999-9999-999999999999';
      const token = await buildToken({ userId: fakeUserId }, null, {
        expiresIn: '1d',
        audience: JWT_TOKEN_TYPES.ACCESS,
        issuer: config.canonicalHostName,
      });

      await expect(
        User.loginFromToken(token, {
          tokenSecret: config.auth.secret,
          tokenIssuer: config.canonicalHostName,
        }),
      ).rejects.toThrow('User does not exist');
    });
  });

  describe('Authentication Middleware Integration', () => {
    it('Should properly set req.user as plain object through middleware', async () => {
      const { User } = models;

      const user = await User.create({
        email: 'middleware-test@example.com',
        displayName: 'Middleware Test User',
        role: 'admin',
        password: 'password123',
      });

      const authenticatedApp = await baseApp.asUser(user);

      // Test whoami endpoint which relies on req.user being a plain object
      const whoamiResponse = await authenticatedApp.get('/api/whoami');
      expect(whoamiResponse).toHaveSucceeded();

      const { body } = whoamiResponse;
      expect(body).toMatchObject({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      });

      // Verify no Sequelize-specific properties
      expect(body).not.toHaveProperty('password');
      expect(body).not.toHaveProperty('hashedPassword');
      expect(body).not.toHaveProperty('_changed');
      expect(body).not.toHaveProperty('dataValues');
    });

    it('Should properly authenticate API requests with JWT tokens', async () => {
      const { User } = models;

      const user = await User.create({
        email: 'api-auth-test@example.com',
        displayName: 'API Auth Test User',
        role: 'admin',
        password: 'password123',
      });

      const authenticatedApp = await baseApp.asUser(user);

      // Test an authenticated endpoint
      const response = await authenticatedApp.get('/api/user/me');
      expect(response).toHaveSucceeded();

      expect(response.body).toMatchObject({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      });
    });

    it('Should reject requests with malformed authorization headers', async () => {
      // Test missing Bearer prefix
      const response1 = await baseApp.get('/api/whoami').set('Authorization', 'InvalidToken');
      expect(response1).toHaveRequestError(401);

      // Test empty token
      const response2 = await baseApp.get('/api/whoami').set('Authorization', 'Bearer ');
      expect(response2).toHaveRequestError(401);

      // Test completely invalid token
      const response3 = await baseApp
        .get('/api/whoami')
        .set('Authorization', 'Bearer invalid.jwt.token');
      expect(response3).toHaveRequestError(401);
    });
  });

  describe('JWT Payload Content Validation', () => {
    it('Should validate userId is a non-empty string', async () => {
      const { User } = models;

      // Test with empty string userId
      const emptyUserIdToken = await new jose.SignJWT({ userId: '' })
        .setProtectedHeader({ alg: JWT_KEY_ALG, kid: JWT_KEY_ID })
        .setIssuedAt()
        .setIssuer(config.canonicalHostName)
        .setAudience(JWT_TOKEN_TYPES.ACCESS)
        .setExpirationTime('1d')
        .sign(new TextEncoder().encode(config.auth.secret));

      await expect(
        User.loginFromToken(emptyUserIdToken, {
          tokenSecret: config.auth.secret,
          tokenIssuer: config.canonicalHostName,
        }),
      ).rejects.toThrow('Invalid token payload');

      // Test with null userId
      const nullUserIdToken = await new jose.SignJWT({ userId: null })
        .setProtectedHeader({ alg: JWT_KEY_ALG, kid: JWT_KEY_ID })
        .setIssuedAt()
        .setIssuer(config.canonicalHostName)
        .setAudience(JWT_TOKEN_TYPES.ACCESS)
        .setExpirationTime('1d')
        .sign(new TextEncoder().encode(config.auth.secret));

      await expect(
        User.loginFromToken(nullUserIdToken, {
          tokenSecret: config.auth.secret,
          tokenIssuer: config.canonicalHostName,
        }),
      ).rejects.toThrow('Invalid token payload');
    });

    it('Should validate deviceId and facilityId when present', async () => {
      const { User } = models;

      const user = await User.create({
        email: 'validation-test@example.com',
        displayName: 'Validation Test User',
        role: 'admin',
        password: 'password123',
      });

      // Test with empty string deviceId
      const emptyDeviceIdToken = await new jose.SignJWT({
        userId: user.id,
        deviceId: '',
      })
        .setProtectedHeader({ alg: JWT_KEY_ALG, kid: JWT_KEY_ID })
        .setIssuedAt()
        .setIssuer(config.canonicalHostName)
        .setAudience(JWT_TOKEN_TYPES.ACCESS)
        .setExpirationTime('1d')
        .sign(new TextEncoder().encode(config.auth.secret));

      await expect(
        User.loginFromToken(emptyDeviceIdToken, {
          tokenSecret: config.auth.secret,
          tokenIssuer: config.canonicalHostName,
        }),
      ).rejects.toThrow('Invalid token payload');

      // Test with empty string facilityId
      const emptyFacilityIdToken = await new jose.SignJWT({
        userId: user.id,
        facilityId: '',
      })
        .setProtectedHeader({ alg: JWT_KEY_ALG, kid: JWT_KEY_ID })
        .setIssuedAt()
        .setIssuer(config.canonicalHostName)
        .setAudience(JWT_TOKEN_TYPES.ACCESS)
        .setExpirationTime('1d')
        .sign(new TextEncoder().encode(config.auth.secret));

      await expect(
        User.loginFromToken(emptyFacilityIdToken, {
          tokenSecret: config.auth.secret,
          tokenIssuer: config.canonicalHostName,
        }),
      ).rejects.toThrow('Invalid token payload');
    });
  });

  describe('JWT Verification Error Handling', () => {
    it('Should handle JWT verification failures correctly', async () => {
      const { User } = models;

      // Test with wrong secret
      const wrongSecretToken = await new jose.SignJWT({ userId: 'test-user-id' })
        .setProtectedHeader({ alg: JWT_KEY_ALG, kid: JWT_KEY_ID })
        .setIssuedAt()
        .setIssuer(config.canonicalHostName)
        .setAudience(JWT_TOKEN_TYPES.ACCESS)
        .setExpirationTime('1d')
        .sign(new TextEncoder().encode('wrong-secret'));

      await expect(
        User.loginFromToken(wrongSecretToken, {
          tokenSecret: config.auth.secret,
          tokenIssuer: config.canonicalHostName,
        }),
      ).rejects.toThrow('Invalid token');

      // Test with wrong issuer
      const wrongIssuerToken = await new jose.SignJWT({ userId: 'test-user-id' })
        .setProtectedHeader({ alg: JWT_KEY_ALG, kid: JWT_KEY_ID })
        .setIssuedAt()
        .setIssuer('wrong-issuer')
        .setAudience(JWT_TOKEN_TYPES.ACCESS)
        .setExpirationTime('1d')
        .sign(new TextEncoder().encode(config.auth.secret));

      await expect(
        User.loginFromToken(wrongIssuerToken, {
          tokenSecret: config.auth.secret,
          tokenIssuer: config.canonicalHostName,
        }),
      ).rejects.toThrow('Invalid token');

      // Test with wrong audience
      const wrongAudienceToken = await new jose.SignJWT({ userId: 'test-user-id' })
        .setProtectedHeader({ alg: JWT_KEY_ALG, kid: JWT_KEY_ID })
        .setIssuedAt()
        .setIssuer(config.canonicalHostName)
        .setAudience('wrong-audience')
        .setExpirationTime('1d')
        .sign(new TextEncoder().encode(config.auth.secret));

      await expect(
        User.loginFromToken(wrongAudienceToken, {
          tokenSecret: config.auth.secret,
          tokenIssuer: config.canonicalHostName,
        }),
      ).rejects.toThrow('Invalid token');
    });
  });
});
