import { SETTINGS_SCOPES, MFA_CHALLENGE_TYPES } from '@tamanu/constants';
import { createTestContext } from '../utilities';

describe('Facility MFA self-service', () => {
  let ctx;
  let baseApp;
  let models;
  let agent;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    // CI runs facility tests with hardcoded permissions: practitioner has
    // write Mfa, base does not (asNewRole DB roles don't exist there)
    agent = await baseApp.asRole('practitioner');

    await models.Setting.set('auth.mfa.enabled', true, SETTINGS_SCOPES.GLOBAL);
    // the test server's canonicalHostName defaults to localhost
    await models.Setting.set('auth.mfa.webauthn.rpid', 'localhost', SETTINGS_SCOPES.GLOBAL);
  });

  afterAll(() => ctx.close());

  describe('gating', () => {
    it('rejects everything when MFA is disabled', async () => {
      await models.Setting.set('auth.mfa.enabled', false, SETTINGS_SCOPES.GLOBAL);
      try {
        const response = await agent.post('/api/mfa/webauthn/register-begin');
        expect(response).toBeForbidden();
      } finally {
        await models.Setting.set('auth.mfa.enabled', true, SETTINGS_SCOPES.GLOBAL);
      }
    });

    it('rejects WebAuthn when this facility is not under the rpid stem (out-of-zone)', async () => {
      await models.Setting.set('auth.mfa.webauthn.rpid', 'foo.bar.com', SETTINGS_SCOPES.GLOBAL);
      try {
        const response = await agent.post('/api/mfa/webauthn/register-begin');
        expect(response).toBeForbidden();
      } finally {
        await models.Setting.set('auth.mfa.webauthn.rpid', 'localhost', SETTINGS_SCOPES.GLOBAL);
      }
    });

    it('forbids users without write Mfa', async () => {
      const lowPrivilegeAgent = await baseApp.asRole('base');
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
      expect(response).toHaveRequestError();
    });

    it('has no TOTP routes — authenticator apps are managed via central', async () => {
      const response = await agent.post('/api/mfa/totp/enrol');
      expect(response.status).toBe(404);
    });
  });

  describe('local registration ceremony', () => {
    it('issues registration options and stores a single-use challenge locally', async () => {
      const response = await agent.post('/api/mfa/webauthn/register-begin');
      expect(response).toHaveSucceeded();

      const { body } = response;
      expect(body.rp).toMatchObject({ id: 'localhost' });
      expect(body.challenge).toEqual(expect.any(String));

      // the ceremony never touches central: the challenge is in our own table
      const challenge = await models.MfaChallenge.findOne({
        where: { token: body.challenge, type: MFA_CHALLENGE_TYPES.WEBAUTHN_REGISTER },
      });
      expect(challenge).toBeTruthy();
      expect(challenge.usedAt).toBeNull();
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
  });

  describe('methods', () => {
    it('lists local passkeys and reports TOTP as managed centrally', async () => {
      const response = await agent.get('/api/mfa/methods');
      expect(response).toHaveSucceeded();
      expect(response.body).toMatchObject({
        webauthn: expect.any(Array),
        totp: { confirmed: false, confirmedAt: null, managedCentrally: true },
      });
    });

    it('shows a confirmed authenticator app from the synced mirror', async () => {
      const user = await models.User.findOne({ where: { email: agent.user.email } });
      const confirmedAt = new Date();
      await user.update({ totpConfirmedAt: confirmedAt });
      try {
        const response = await agent.get('/api/mfa/methods');
        expect(response).toHaveSucceeded();
        expect(response.body.totp).toMatchObject({
          confirmed: true,
          managedCentrally: true,
        });
        expect(response.body.totp.confirmedAt).not.toBeNull();
      } finally {
        await user.update({ totpConfirmedAt: null });
      }
    });

    it('renames an own passkey', async () => {
      const user = await models.User.findOne({ where: { email: agent.user.email } });
      const credential = await models.WebAuthnCredential.create({
        userId: user.id,
        credentialId: 'rename-cred-id',
        publicKey: 'AAAA',
        rpId: 'localhost',
        enrolmentOrigin: 'http://localhost',
      });

      const rename = await agent
        .patch(`/api/mfa/webauthn/${credential.id}`)
        .send({ friendlyName: 'Front desk key' });
      expect(rename).toHaveSucceeded();
      await credential.reload();
      expect(credential.friendlyName).toBe('Front desk key');

      // a blank name is refused
      const blank = await agent
        .patch(`/api/mfa/webauthn/${credential.id}`)
        .send({ friendlyName: '   ' });
      expect(blank).toHaveRequestError();

      await credential.destroy();
    });

    it('soft-deletes a passkey so the tombstone syncs out', async () => {
      const { models: m } = ctx;
      const user = await m.User.findOne({ where: { email: agent.user.email } });
      const credential = await m.WebAuthnCredential.create({
        userId: user.id,
        credentialId: 'test-cred-id',
        publicKey: 'AAAA',
        rpId: 'localhost',
        enrolmentOrigin: 'http://localhost',
        friendlyName: 'Test key',
      });

      const del = await agent.delete(`/api/mfa/webauthn/${credential.id}`);
      expect(del).toHaveSucceeded();

      const gone = await m.WebAuthnCredential.findByPk(credential.id);
      expect(gone).toBeNull();
      const tombstone = await m.WebAuthnCredential.findByPk(credential.id, { paranoid: false });
      expect(tombstone.deletedAt).not.toBeNull();
    });

    it("cannot delete another user's passkey", async () => {
      const { models: m } = ctx;
      const otherAgent = await baseApp.asRole('practitioner');
      const otherUser = await m.User.findOne({ where: { email: otherAgent.user.email } });
      const credential = await m.WebAuthnCredential.create({
        userId: otherUser.id,
        credentialId: 'other-cred-id',
        publicKey: 'AAAA',
        rpId: 'localhost',
        enrolmentOrigin: 'http://localhost',
      });

      const del = await agent.delete(`/api/mfa/webauthn/${credential.id}`);
      expect(del).toHaveRequestError();
      expect(await m.WebAuthnCredential.findByPk(credential.id)).not.toBeNull();
    });
  });
});
