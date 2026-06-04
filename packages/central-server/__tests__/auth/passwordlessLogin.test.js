import { SETTINGS_SCOPES, MFA_CHALLENGE_TYPES, MFA_PASSWORDLESS } from '@tamanu/constants';
import { createTestContext } from '../utilities';

describe('Passwordless login', () => {
  let ctx;
  let baseApp;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;

    await models.Setting.set('auth.mfa.enabled', true, SETTINGS_SCOPES.GLOBAL);
    await models.Setting.set('auth.mfa.webauthn.rpid', 'localhost', SETTINGS_SCOPES.GLOBAL);
    // the default is onRequest, but be explicit: these tests are about the gate
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

    it('is refused when passwordless is off — the server-enforced boundary', async () => {
      await models.Setting.set(
        'auth.mfa.passwordless',
        MFA_PASSWORDLESS.OFF,
        SETTINGS_SCOPES.GLOBAL,
      );
      try {
        const begin = await baseApp.post('/api/login/webauthn/assert-begin');
        expect(begin).toBeForbidden();
        const finish = await baseApp
          .post('/api/login/webauthn/assert-finish')
          .send({ assertionResponse: { id: 'x', response: {} } });
        expect(finish).toBeForbidden();
      } finally {
        await models.Setting.set(
          'auth.mfa.passwordless',
          MFA_PASSWORDLESS.ON_REQUEST,
          SETTINGS_SCOPES.GLOBAL,
        );
      }
    });

    it('is refused when this server is not under the rpid stem', async () => {
      await models.Setting.set('auth.mfa.webauthn.rpid', 'foo.bar.com', SETTINGS_SCOPES.GLOBAL);
      try {
        const response = await baseApp.post('/api/login/webauthn/assert-begin');
        expect(response).toBeForbidden();
      } finally {
        await models.Setting.set('auth.mfa.webauthn.rpid', 'localhost', SETTINGS_SCOPES.GLOBAL);
      }
    });

    it('promoted is also accepted server-side (only off rejects)', async () => {
      await models.Setting.set(
        'auth.mfa.passwordless',
        MFA_PASSWORDLESS.PROMOTED,
        SETTINGS_SCOPES.GLOBAL,
      );
      try {
        const response = await baseApp.post('/api/login/webauthn/assert-begin');
        expect(response).toHaveSucceeded();
      } finally {
        await models.Setting.set(
          'auth.mfa.passwordless',
          MFA_PASSWORDLESS.ON_REQUEST,
          SETTINGS_SCOPES.GLOBAL,
        );
      }
    });
  });

  describe('ceremony', () => {
    it('issues a usernameless challenge: no allowCredentials, UV required', async () => {
      const response = await baseApp.post('/api/login/webauthn/assert-begin');
      expect(response).toHaveSucceeded();

      const { body } = response;
      expect(body.challenge).toEqual(expect.any(String));
      expect(body.allowCredentials ?? []).toHaveLength(0);
      expect(body.userVerification).toBe('required');

      // the challenge is user-unbound: who is logging in is only known once
      // the authenticator answers
      const challenge = await models.MfaChallenge.findOne({
        where: { token: body.challenge, type: MFA_CHALLENGE_TYPES.WEBAUTHN_ASSERT },
      });
      expect(challenge).toBeTruthy();
      expect(challenge.userId).toBeNull();
    });

    it('rejects an unparsable finish', async () => {
      const response = await baseApp.post('/api/login/webauthn/assert-finish').send({
        assertionResponse: { id: 'x', response: { clientDataJSON: '%%%' } },
      });
      expect(response).toHaveRequestError();
    });

    it('rejects an unknown credential and consumes the challenge', async () => {
      const begin = await baseApp.post('/api/login/webauthn/assert-begin');
      const { challenge } = begin.body;

      const clientDataJSON = Buffer.from(
        JSON.stringify({ type: 'webauthn.get', challenge, origin: 'http://localhost:3000' }),
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
      // no token of any kind leaks on the failure path
      expect(finish.body.token).toBeUndefined();

      const row = await models.MfaChallenge.findOne({ where: { token: challenge } });
      expect(row.usedAt).not.toBeNull();
    });
  });
});
