import * as OTPAuth from 'otpauth';

import { SETTINGS_SCOPES, MFA_CHALLENGE_TYPES, MFA_TOTP_AVAILABILITY } from '@tamanu/constants';
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
    // pin availability so the suite doesn't inherit a leftover 'off' from a
    // prior run's interrupted restore (the persistent test DB keeps settings)
    await models.Setting.set(
      'auth.mfa.totp.availability',
      MFA_TOTP_AVAILABILITY.ALL,
      SETTINGS_SCOPES.GLOBAL,
    );
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
      // credProps is requested so we can record passwordless capability
      expect(body.extensions).toMatchObject({ credProps: true });

      const challenge = await models.MfaChallenge.findOne({
        where: { token: body.challenge, type: MFA_CHALLENGE_TYPES.WEBAUTHN_REGISTER },
      });
      expect(challenge).toBeTruthy();
      expect(challenge.usedAt).toBeNull();
      expect(challenge.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('forces a discoverable credential when residentKey is required', async () => {
      await models.Setting.set('auth.mfa.webauthn.residentKey', 'required', SETTINGS_SCOPES.GLOBAL);
      try {
        const response = await agent.post('/api/mfa/webauthn/register-begin');
        expect(response).toHaveSucceeded();
        expect(response.body.authenticatorSelection).toMatchObject({ residentKey: 'required' });
      } finally {
        await models.Setting.set(
          'auth.mfa.webauthn.residentKey',
          'preferred',
          SETTINGS_SCOPES.GLOBAL,
        );
      }
    });

    it('forces a discoverable credential on the requireResidentKey retry', async () => {
      // the warn-mode "try again for passwordless" retry, default setting
      const response = await agent
        .post('/api/mfa/webauthn/register-begin')
        .send({ requireResidentKey: true });
      expect(response).toHaveSucceeded();
      expect(response.body.authenticatorSelection).toMatchObject({ residentKey: 'required' });
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

    it('rejects a finish with an unparsable response', async () => {
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
      // the resident-key policy is exposed so the client can warn/retry
      expect(response.body.residentKeyMode).toEqual(expect.any(String));
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
      // the passwordless and user-verification capability flags are surfaced
      // per credential
      const summary = list.body.webauthn.find(c => c.id === credential.id);
      expect(summary).toHaveProperty('discoverable');
      expect(summary).toHaveProperty('userVerified');

      const del = await agent.delete(`/api/mfa/webauthn/${credential.id}`);
      expect(del).toHaveSucceeded();

      const reload = await models.WebAuthnCredential.findByPk(credential.id, { paranoid: false });
      expect(reload.deletedAt).not.toBeNull();

      const again = await agent.delete(`/api/mfa/webauthn/${credential.id}`);
      expect(again.status).toBe(404);
    });

    it('renames an owned credential, refusing blank names and unknown ids', async () => {
      const credential = await models.WebAuthnCredential.create({
        userId: agent.user.id,
        credentialId: 'rename-credential-id',
        publicKey: 'dGVzdA',
        rpId: 'localhost',
      });

      const rename = await agent
        .patch(`/api/mfa/webauthn/${credential.id}`)
        .send({ friendlyName: 'Front desk key' });
      expect(rename).toHaveSucceeded();
      await credential.reload();
      expect(credential.friendlyName).toBe('Front desk key');

      const blank = await agent
        .patch(`/api/mfa/webauthn/${credential.id}`)
        .send({ friendlyName: '   ' });
      expect(blank).toHaveRequestError();

      // someone else's credential is a 404, not a hit
      const otherAgent = await baseApp.asNewRole([['write', 'Mfa']]);
      const foreign = await otherAgent
        .patch(`/api/mfa/webauthn/${credential.id}`)
        .send({ friendlyName: 'Mine now' });
      expect(foreign.status).toBe(404);

      await credential.destroy();
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
      expect(methods.body.totp).toEqual({
        enrolled: true,
        confirmed: true,
        confirmedAt: expect.any(String),
      });

      // the synced mirror on the user row follows, so facilities can show it
      const mirrorUser = await models.User.findByPk(totpAgent.user.id);
      expect(mirrorUser.totpConfirmedAt).not.toBeNull();
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
      expect(methods.body.totp).toEqual({
        enrolled: true,
        confirmed: false,
        confirmedAt: null,
      });

      // re-enrolment resets the synced mirror too
      const mirrorUser = await models.User.findByPk(totpAgent.user.id);
      expect(mirrorUser.totpConfirmedAt).toBeNull();
    });

    it('removes the authenticator app, clearing the seed and the synced mirror', async () => {
      const enrol = await totpAgent.post('/api/mfa/totp/enrol');
      const code = OTPAuth.URI.parse(enrol.body.otpauthUrl).generate();
      await totpAgent.post('/api/mfa/totp/confirm').send({ code });

      const remove = await totpAgent.delete('/api/mfa/totp');
      expect(remove).toHaveSucceeded();

      const methods = await totpAgent.get('/api/mfa/methods');
      expect(methods.body.totp).toEqual({ enrolled: false, confirmed: false, confirmedAt: null });

      // central-only table is hard-deleted; the synced mirror is cleared
      const seed = await models.TotpSecret.findOne({
        where: { userId: totpAgent.user.id },
        paranoid: false,
      });
      expect(seed).toBeNull();
      const mirrorUser = await models.User.findByPk(totpAgent.user.id);
      expect(mirrorUser.totpConfirmedAt).toBeNull();
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
