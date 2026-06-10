import { SETTINGS_SCOPES, MFA_CHALLENGE_TYPES, MFA_PASSWORDLESS } from '@tamanu/constants';
import { createTestContext } from '../utilities';

/**
 * Facility passwordless login is FULLY LOCAL: the central connection is never
 * involved (createTestContext mocks it, and nothing here configures the mock
 * — any attempt to call central would fail loudly).
 */
describe('Facility passwordless login', () => {
  let ctx;
  let baseApp;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;

    await models.Setting.set('auth.mfa.enabled', true, SETTINGS_SCOPES.GLOBAL);
    await models.Setting.set('auth.mfa.webauthn.rpid', 'localhost', SETTINGS_SCOPES.GLOBAL);
    await models.Setting.set(
      'auth.mfa.passwordless',
      MFA_PASSWORDLESS.ON_REQUEST,
      SETTINGS_SCOPES.GLOBAL,
    );
  });

  afterAll(() => ctx.close());

  describe('gating', () => {
    it('is refused when MFA is disabled', async () => {
      await models.Setting.set('auth.mfa.enabled', false, SETTINGS_SCOPES.GLOBAL);
      try {
        const response = await baseApp.post('/api/login/webauthn/assert-begin');
        expect(response).toBeForbidden();
      } finally {
        await models.Setting.set('auth.mfa.enabled', true, SETTINGS_SCOPES.GLOBAL);
      }
    });

    it('is refused when passwordless is off', async () => {
      await models.Setting.set(
        'auth.mfa.passwordless',
        MFA_PASSWORDLESS.OFF,
        SETTINGS_SCOPES.GLOBAL,
      );
      try {
        const response = await baseApp.post('/api/login/webauthn/assert-begin');
        expect(response).toBeForbidden();
      } finally {
        await models.Setting.set(
          'auth.mfa.passwordless',
          MFA_PASSWORDLESS.ON_REQUEST,
          SETTINGS_SCOPES.GLOBAL,
        );
      }
    });

    it('is refused out-of-zone (facility origin not under the rpid)', async () => {
      await models.Setting.set('auth.mfa.webauthn.rpid', 'foo.bar.com', SETTINGS_SCOPES.GLOBAL);
      try {
        const response = await baseApp.post('/api/login/webauthn/assert-begin');
        expect(response).toBeForbidden();
      } finally {
        await models.Setting.set('auth.mfa.webauthn.rpid', 'localhost', SETTINGS_SCOPES.GLOBAL);
      }
    });
  });

  describe('public loginFeatures', () => {
    it('reports the effective mode, off when disabled or out-of-zone', async () => {
      const enabled = await baseApp.get('/api/public/loginFeatures');
      expect(enabled).toHaveSucceeded();
      expect(enabled.body).toEqual({ passwordless: MFA_PASSWORDLESS.ON_REQUEST });

      await models.Setting.set('auth.mfa.enabled', false, SETTINGS_SCOPES.GLOBAL);
      try {
        const disabled = await baseApp.get('/api/public/loginFeatures');
        expect(disabled.body).toEqual({ passwordless: MFA_PASSWORDLESS.OFF });
      } finally {
        await models.Setting.set('auth.mfa.enabled', true, SETTINGS_SCOPES.GLOBAL);
      }

      await models.Setting.set('auth.mfa.webauthn.rpid', 'foo.bar.com', SETTINGS_SCOPES.GLOBAL);
      try {
        const outOfZone = await baseApp.get('/api/public/loginFeatures');
        expect(outOfZone.body).toEqual({ passwordless: MFA_PASSWORDLESS.OFF });
      } finally {
        await models.Setting.set('auth.mfa.webauthn.rpid', 'localhost', SETTINGS_SCOPES.GLOBAL);
      }
    });
  });

  describe('local ceremony', () => {
    it('issues a usernameless challenge from the local table', async () => {
      const response = await baseApp.post('/api/login/webauthn/assert-begin');
      expect(response).toHaveSucceeded();
      expect(response.body.challenge).toEqual(expect.any(String));
      expect(response.body.allowCredentials ?? []).toHaveLength(0);
      expect(response.body.userVerification).toBe('required');

      // local challenge: verification never needs central
      const challenge = await models.MfaChallenge.findOne({
        where: { token: response.body.challenge, type: MFA_CHALLENGE_TYPES.WEBAUTHN_ASSERT },
      });
      expect(challenge).toBeTruthy();
      expect(challenge.userId).toBeNull();
    });

    it('rejects an unknown credential and consumes the challenge', async () => {
      const begin = await baseApp.post('/api/login/webauthn/assert-begin');
      const { challenge } = begin.body;

      const clientDataJSON = Buffer.from(
        JSON.stringify({ type: 'webauthn.get', challenge, origin: 'http://localhost' }),
      ).toString('base64url');
      const finish = await baseApp.post('/api/login/webauthn/assert-finish').send({
        assertionResponse: {
          id: 'unknown-credential',
          rawId: 'unknown-credential',
          type: 'public-key',
          clientExtensionResults: {},
          response: { clientDataJSON, authenticatorData: 'AAAA', signature: 'AAAA' },
        },
      });
      expect(finish).toHaveRequestError();
      expect(finish.body.token).toBeUndefined();

      const row = await models.MfaChallenge.findOne({ where: { token: challenge } });
      expect(row.usedAt).not.toBeNull();
    });
  });
});
