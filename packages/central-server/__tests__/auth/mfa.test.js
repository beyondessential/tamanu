import * as OTPAuth from 'otpauth';

import { SETTINGS_SCOPES, MFA_CHALLENGE_TYPES } from '@tamanu/constants';
import { createTestContext } from '../utilities';

// Use a fixed 32-byte buffer as the settings PSK so the TOTP seed
// encrypt/decrypt works in tests without a real key file or config secret.
jest.mock('@tamanu/shared/utils/crypto', () => {
  const original = jest.requireActual('@tamanu/shared/utils/crypto');
  return {
    ...original,
    getSettingsPskKeyBuffer: jest.fn(async () => Buffer.alloc(32, 0xab)),
  };
});

describe('MFA self-service', () => {
  let ctx;
  let baseApp;
  let models;
  let agent;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;
    agent = await baseApp.asNewRole([['write', 'Mfa']]);

    await models.Setting.set('auth.mfa.enabled', true, SETTINGS_SCOPES.GLOBAL);
    // the test server's canonicalHostName is on localhost
    await models.Setting.set('auth.mfa.webauthn.rpid', 'localhost', SETTINGS_SCOPES.GLOBAL);
  });

  afterAll(() => ctx.close());

  describe('feature gating', () => {
    it('rejects everything when MFA is disabled', async () => {
      await models.Setting.set('auth.mfa.enabled', false, SETTINGS_SCOPES.GLOBAL);
      try {
        const response = await agent.post('/api/mfa/webauthn/register-begin');
        expect(response).toBeForbidden();
      } finally {
        await models.Setting.set('auth.mfa.enabled', true, SETTINGS_SCOPES.GLOBAL);
      }
    });

    it('rejects WebAuthn when this server is not under the rpid stem', async () => {
      await models.Setting.set('auth.mfa.webauthn.rpid', 'foo.bar.com', SETTINGS_SCOPES.GLOBAL);
      try {
        const response = await agent.post('/api/mfa/webauthn/register-begin');
        expect(response).toBeForbidden();
      } finally {
        await models.Setting.set('auth.mfa.webauthn.rpid', 'localhost', SETTINGS_SCOPES.GLOBAL);
      }
    });

    it('rejects WebAuthn when no rpid is configured', async () => {
      await models.Setting.set('auth.mfa.webauthn.rpid', '', SETTINGS_SCOPES.GLOBAL);
      try {
        const response = await agent.post('/api/mfa/webauthn/register-begin');
        expect(response).toBeForbidden();
      } finally {
        await models.Setting.set('auth.mfa.webauthn.rpid', 'localhost', SETTINGS_SCOPES.GLOBAL);
      }
    });
  });

  describe('permissions', () => {
    it('forbids users without write Mfa', async () => {
      const lowPrivilegeAgent = await baseApp.asNewRole([]);
      const responses = await Promise.all([
        lowPrivilegeAgent.post('/api/mfa/webauthn/register-begin'),
        lowPrivilegeAgent.post('/api/mfa/webauthn/register-finish').send({}),
        lowPrivilegeAgent.get('/api/mfa/methods'),
        lowPrivilegeAgent.delete('/api/mfa/webauthn/some-id'),
      ]);
      for (const response of responses) {
        expect(response).toBeForbidden();
      }
    });

    it('rejects unauthenticated requests', async () => {
      const response = await baseApp.post('/api/mfa/webauthn/register-begin');
      // MissingCredentialError; central's convention for a missing auth header
      expect(response.status).toBe(400);
    });
  });

  describe('registration ceremony', () => {
    it('issues registration options and stores a single-use challenge', async () => {
      const response = await agent.post('/api/mfa/webauthn/register-begin');
      expect(response).toHaveSucceeded();

      const { body } = response;
      expect(body.rp).toMatchObject({ id: 'localhost', name: 'Tamanu' });
      expect(body.challenge).toEqual(expect.any(String));
      expect(body.authenticatorSelection).toMatchObject({
        residentKey: 'preferred',
        userVerification: 'required',
      });

      const challenge = await models.MfaChallenge.findOne({
        where: { token: body.challenge, type: MFA_CHALLENGE_TYPES.WEBAUTHN_REGISTER },
      });
      expect(challenge).toBeTruthy();
      expect(challenge.usedAt).toBeNull();
      expect(challenge.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('rejects a finish with no matching challenge', async () => {
      const clientDataJSON = Buffer.from(
        JSON.stringify({ type: 'webauthn.create', challenge: 'bogus-challenge' }),
      ).toString('base64url');
      const response = await agent.post('/api/mfa/webauthn/register-finish').send({
        registrationResponse: { id: 'x', response: { clientDataJSON } },
      });
      expect(response).toHaveRequestError();
    });

    it('rejects a finish with an unparseable response', async () => {
      const response = await agent.post('/api/mfa/webauthn/register-finish').send({
        registrationResponse: { id: 'x', response: { clientDataJSON: '%%%' } },
      });
      expect(response).toHaveRequestError();
    });

    it('consumes the challenge even when verification fails', async () => {
      const begin = await agent.post('/api/mfa/webauthn/register-begin');
      const { challenge } = begin.body;

      const clientDataJSON = Buffer.from(
        JSON.stringify({ type: 'webauthn.create', challenge, origin: 'http://localhost:3000' }),
      ).toString('base64url');
      const finish = await agent.post('/api/mfa/webauthn/register-finish').send({
        // a syntactically plausible but cryptographically garbage response
        registrationResponse: {
          id: 'AAAA',
          rawId: 'AAAA',
          type: 'public-key',
          clientExtensionResults: {},
          response: { clientDataJSON, attestationObject: 'AAAA' },
        },
      });
      expect(finish).toHaveRequestError();

      const row = await models.MfaChallenge.findOne({ where: { token: challenge } });
      expect(row.usedAt).not.toBeNull();

      // and the same challenge can't be replayed
      const replay = await agent.post('/api/mfa/webauthn/register-finish').send({
        registrationResponse: {
          id: 'AAAA',
          rawId: 'AAAA',
          type: 'public-key',
          clientExtensionResults: {},
          response: { clientDataJSON, attestationObject: 'AAAA' },
        },
      });
      expect(replay).toHaveRequestError();
    });
  });

  describe('methods', () => {
    it('lists the user’s factors', async () => {
      const response = await agent.get('/api/mfa/methods');
      expect(response).toHaveSucceeded();
      expect(response.body).toMatchObject({
        webauthn: expect.any(Array),
        totp: { enrolled: false, confirmed: false },
      });
    });

    it('soft-deletes an owned credential and 404s on unknown ids', async () => {
      // plant a credential directly — full ceremony verification is exercised
      // by the Playwright suite with a virtual authenticator
      const credential = await models.WebAuthnCredential.create({
        userId: agent.user.id,
        credentialId: 'test-credential-id',
        publicKey: 'dGVzdA',
        rpId: 'localhost',
      });

      const list = await agent.get('/api/mfa/methods');
      expect(list.body.webauthn.map(c => c.id)).toContain(credential.id);

      const del = await agent.delete(`/api/mfa/webauthn/${credential.id}`);
      expect(del).toHaveSucceeded();

      const reload = await models.WebAuthnCredential.findByPk(credential.id, { paranoid: false });
      expect(reload.deletedAt).not.toBeNull();

      const again = await agent.delete(`/api/mfa/webauthn/${credential.id}`);
      expect(again.status).toBe(404);
    });
  });

  describe('totp', () => {
    let totpAgent;

    beforeAll(async () => {
      totpAgent = await baseApp.asNewRole([['write', 'Mfa']]);
    });

    it('enrols and confirms with a code from the authenticator', async () => {
      const enrol = await totpAgent.post('/api/mfa/totp/enrol');
      expect(enrol).toHaveSucceeded();
      expect(enrol.body.otpauthUrl).toMatch(/^otpauth:\/\/totp\//);

      // the seed must be at rest as an encrypted envelope, never plaintext
      const row = await models.TotpSecret.findOne({ where: { userId: totpAgent.user.id } });
      expect(row.secret).toMatch(/^S1:/);
      expect(row.confirmedAt).toBeNull();

      const wrong = await totpAgent.post('/api/mfa/totp/confirm').send({ code: '000000' });
      expect(wrong).toHaveRequestError();

      // play the authenticator app: derive the current code from the URI
      const code = OTPAuth.URI.parse(enrol.body.otpauthUrl).generate();
      const confirm = await totpAgent.post('/api/mfa/totp/confirm').send({ code });
      expect(confirm).toHaveSucceeded();

      const methods = await totpAgent.get('/api/mfa/methods');
      expect(methods.body.totp).toEqual({ enrolled: true, confirmed: true });
    });

    it('re-enrolling replaces the seed and resets confirmation', async () => {
      const first = await totpAgent.post('/api/mfa/totp/enrol');
      const second = await totpAgent.post('/api/mfa/totp/enrol');
      expect(second).toHaveSucceeded();
      expect(second.body.otpauthUrl).not.toEqual(first.body.otpauthUrl);

      // codes from the replaced seed no longer work
      const staleCode = OTPAuth.URI.parse(first.body.otpauthUrl).generate();
      const stale = await totpAgent.post('/api/mfa/totp/confirm').send({ code: staleCode });
      expect(stale).toHaveRequestError();

      const methods = await totpAgent.get('/api/mfa/methods');
      expect(methods.body.totp).toEqual({ enrolled: true, confirmed: false });
    });

    it('is refused when availability is off', async () => {
      await models.Setting.set('auth.mfa.totp.availability', 'off', SETTINGS_SCOPES.GLOBAL);
      try {
        const response = await totpAgent.post('/api/mfa/totp/enrol');
        expect(response).toBeForbidden();
      } finally {
        await models.Setting.set('auth.mfa.totp.availability', 'all', SETTINGS_SCOPES.GLOBAL);
      }
    });

    it('fallbackOnly: refused where WebAuthn is available, allowed where it is not', async () => {
      await models.Setting.set(
        'auth.mfa.totp.availability',
        'fallbackOnly',
        SETTINGS_SCOPES.GLOBAL,
      );
      try {
        // this server is under the rpid stem, so WebAuthn is available here
        const refused = await totpAgent.post('/api/mfa/totp/enrol');
        expect(refused).toBeForbidden();

        // with no rpid, WebAuthn is off and TOTP becomes the fallback
        await models.Setting.set('auth.mfa.webauthn.rpid', '', SETTINGS_SCOPES.GLOBAL);
        const allowed = await totpAgent.post('/api/mfa/totp/enrol');
        expect(allowed).toHaveSucceeded();
      } finally {
        await models.Setting.set('auth.mfa.totp.availability', 'all', SETTINGS_SCOPES.GLOBAL);
        await models.Setting.set('auth.mfa.webauthn.rpid', 'localhost', SETTINGS_SCOPES.GLOBAL);
      }
    });
  });
});
