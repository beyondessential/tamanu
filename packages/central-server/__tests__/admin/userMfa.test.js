import * as OTPAuth from 'otpauth';

import { SETTINGS_SCOPES, MFA_CHALLENGE_TYPES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';

// Fixed PSK so TOTP seed encrypt/decrypt works without a real key file.
jest.mock('@tamanu/shared/utils/crypto', () => {
  const original = jest.requireActual('@tamanu/shared/utils/crypto');
  return {
    ...original,
    getSettingsPskKeyBuffer: jest.fn(async () => Buffer.alloc(32, 0xab)),
  };
});

const TARGET_PASSWORD = 'target-password-1Q2Q';

describe('Admin MFA management and enrolment invites', () => {
  let ctx;
  let baseApp;
  let models;
  let adminAgent;
  let target;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;
    adminAgent = await baseApp.asNewRole([
      ['read', 'UserMfa'],
      ['write', 'UserMfa'],
    ]);
    // the target user deliberately has NO MFA permissions: admin-driven
    // enrolment must not require any
    target = await models.User.create(fake(models.User, { password: TARGET_PASSWORD }));

    await models.Setting.set('auth.mfa.enabled', true, SETTINGS_SCOPES.GLOBAL);
    await models.Setting.set('auth.mfa.webauthn.rpid', 'localhost', SETTINGS_SCOPES.GLOBAL);
  });

  afterAll(() => ctx.close());

  describe('permissions', () => {
    it('forbids users without the UserMfa permissions', async () => {
      const lowPrivilegeAgent = await baseApp.asNewRole([['write', 'Mfa']]);
      const responses = await Promise.all([
        lowPrivilegeAgent.get(`/api/admin/users/${target.id}/mfa`),
        lowPrivilegeAgent.delete(`/api/admin/users/${target.id}/mfa`),
        lowPrivilegeAgent.post(`/api/admin/users/${target.id}/mfa/enrolInvite`),
        lowPrivilegeAgent.post(`/api/admin/users/${target.id}/mfa/webauthn/register-begin`),
      ]);
      for (const response of responses) {
        expect(response).toBeForbidden();
      }
    });

    it('read UserMfa allows viewing but not resetting', async () => {
      const readOnlyAgent = await baseApp.asNewRole([['read', 'UserMfa']]);
      const view = await readOnlyAgent.get(`/api/admin/users/${target.id}/mfa`);
      expect(view).toHaveSucceeded();
      const reset = await readOnlyAgent.delete(`/api/admin/users/${target.id}/mfa`);
      expect(reset).toBeForbidden();
    });
  });

  describe('status and reset', () => {
    it('reports a user’s factors and clears them on reset', async () => {
      const victim = await models.User.create(
        fake(models.User, { totpConfirmedAt: new Date() }),
      );
      await models.WebAuthnCredential.create({
        userId: victim.id,
        credentialId: `cred-${victim.id}`,
        publicKey: 'dGVzdA',
        rpId: 'localhost',
      });
      await models.TotpSecret.create({
        userId: victim.id,
        secret: 'S1:AAAA:BBBB',
        confirmedAt: new Date(),
      });

      const before = await adminAgent.get(`/api/admin/users/${victim.id}/mfa`);
      expect(before.body.webauthn).toHaveLength(1);
      expect(before.body.totp).toEqual({
        enrolled: true,
        confirmed: true,
        confirmedAt: expect.any(String),
      });

      const reset = await adminAgent.delete(`/api/admin/users/${victim.id}/mfa`);
      expect(reset).toHaveSucceeded();

      const after = await adminAgent.get(`/api/admin/users/${victim.id}/mfa`);
      expect(after.body.webauthn).toHaveLength(0);
      expect(after.body.totp).toEqual({ enrolled: false, confirmed: false, confirmedAt: null });

      // the synced mirror clears with the reset
      await victim.reload();
      expect(victim.totpConfirmedAt).toBeNull();

      // webauthn rows are tombstoned (must sync out); totp rows are hard
      // deleted (central-only, and the unique index must free up)
      const credential = await models.WebAuthnCredential.findOne({
        where: { userId: victim.id },
        paranoid: false,
      });
      expect(credential.deletedAt).not.toBeNull();
      const seed = await models.TotpSecret.findOne({
        where: { userId: victim.id },
        paranoid: false,
      });
      expect(seed).toBeNull();

      // and the user can be re-enrolled afterwards
      await models.TotpSecret.create({ userId: victim.id, secret: 'S1:CCCC:DDDD' });
    });

    it('reports whether the user could self-enrol instead', async () => {
      // the invite target has no MFA permissions: invites are for them
      const targetStatus = await adminAgent.get(`/api/admin/users/${target.id}/mfa`);
      expect(targetStatus.body.canSelfEnrol).toBe(false);

      // a write-Mfa user manages their own factors; no invite needed
      const selfServiceAgent = await baseApp.asNewRole([['write', 'Mfa']]);
      const selfStatus = await adminAgent.get(
        `/api/admin/users/${selfServiceAgent.user.id}/mfa`,
      );
      expect(selfStatus.body.canSelfEnrol).toBe(true);
    });

    it('reports whether the user is MFA-required (literal rows, not wildcards)', async () => {
      expect((await adminAgent.get(`/api/admin/users/${target.id}/mfa`)).body.mfaRequired).toBe(
        false,
      );

      const requiredAgent = await baseApp.asNewRole([['require', 'Mfa']]);
      const requiredStatus = await adminAgent.get(
        `/api/admin/users/${requiredAgent.user.id}/mfa`,
      );
      expect(requiredStatus.body.mfaRequired).toBe(true);
      // require Mfa alone doesn't grant self-service
      expect(requiredStatus.body.canSelfEnrol).toBe(false);
    });

    it('404s on unknown users', async () => {
      const response = await adminAgent.get('/api/admin/users/no-such-user/mfa');
      expect(response.status).toBe(404);
    });

    it('reports factor presence in the admin users list', async () => {
      const listed = await models.User.create(
        fake(models.User, { totpConfirmedAt: new Date() }),
      );
      await models.WebAuthnCredential.create({
        userId: listed.id,
        credentialId: `list-cred-${listed.id}`,
        publicKey: 'dGVzdA',
        rpId: 'localhost',
      });

      const listAgent = await baseApp.asNewRole([['list', 'User']]);
      const response = await listAgent.get('/api/admin/users').query({ email: listed.email });
      expect(response).toHaveSucceeded();
      const row = response.body.data.find(user => user.id === listed.id);
      expect(row.mfa).toEqual({ webauthn: true, totp: true });
    });
  });

  describe('hybrid-QR provisioning', () => {
    it('binds the registration ceremony to the target user', async () => {
      const begin = await adminAgent.post(
        `/api/admin/users/${target.id}/mfa/webauthn/register-begin`,
      );
      expect(begin).toHaveSucceeded();
      expect(begin.body.user.name).toEqual(target.email);

      // steered to the user's own remote device (phone over QR/hybrid), not
      // the admin's local authenticator: cross-platform + a hybrid hint
      expect(begin.body.authenticatorSelection?.authenticatorAttachment).toBe('cross-platform');
      expect(begin.body.hints ?? []).toContain('hybrid');

      const challenge = await models.MfaChallenge.findOne({
        where: { token: begin.body.challenge, type: MFA_CHALLENGE_TYPES.WEBAUTHN_REGISTER },
      });
      expect(challenge.userId).toEqual(target.id);
    });
  });

  describe('enrolment invites', () => {
    const issueInvite = async () => {
      const response = await adminAgent.post(`/api/admin/users/${target.id}/mfa/enrolInvite`);
      expect(response).toHaveSucceeded();
      return response.body;
    };

    it('issues a token with the configured expiry', async () => {
      const { token, expiresAt } = await issueInvite();
      expect(token).toEqual(expect.any(String));
      // default expiry is 60 minutes
      const minutesAway = (new Date(expiresAt).getTime() - Date.now()) / 60_000;
      expect(minutesAway).toBeGreaterThan(55);
      expect(minutesAway).toBeLessThan(65);
    });

    it('emails the invite with instructions instead of disclosing the token', async () => {
      ctx.emailService.sendEmail.mockClear();
      const response = await adminAgent
        .post(`/api/admin/users/${target.id}/mfa/enrolInvite`)
        .send({ sendEmail: true });
      expect(response).toHaveSucceeded();
      // the admin sees where it went, never the token itself
      expect(response.body.sentTo).toEqual(target.email);
      expect(response.body.token).toBeUndefined();

      expect(ctx.emailService.sendEmail).toHaveBeenCalledTimes(1);
      const [message] = ctx.emailService.sendEmail.mock.calls[0];
      expect(message.to).toEqual(target.email);
      // the email carries the token and tells the user what to do with it
      expect(message.text).toContain('Have an MFA enrolment invite?');
      const invite = await models.MfaChallenge.findOne({
        where: { userId: target.id, usedAt: null },
        order: [['createdAt', 'DESC']],
      });
      expect(message.text).toContain(invite.token);
    });

    it('redeem requires the token AND the password', async () => {
      const { token } = await issueInvite();

      const wrongPassword = await baseApp.post('/api/mfa/enrolInvite/redeem').send({
        email: target.email,
        password: 'not-the-password',
        token,
      });
      expect(wrongPassword).toHaveRequestError();

      const wrongToken = await baseApp.post('/api/mfa/enrolInvite/redeem').send({
        email: target.email,
        password: TARGET_PASSWORD,
        token: 'bogus',
      });
      expect(wrongToken).toHaveRequestError();

      const good = await baseApp.post('/api/mfa/enrolInvite/redeem').send({
        email: target.email,
        password: TARGET_PASSWORD,
        token,
      });
      expect(good).toHaveSucceeded();
      expect(good.body.token).toEqual(expect.any(String));
      expect(good.body.user).toMatchObject({ id: target.id });

      // single-use: the same invite cannot be redeemed twice
      const replay = await baseApp.post('/api/mfa/enrolInvite/redeem').send({
        email: target.email,
        password: TARGET_PASSWORD,
        token,
      });
      expect(replay).toHaveRequestError();
    });

    it('rejects expired invites', async () => {
      const expired = await models.MfaChallenge.create({
        type: MFA_CHALLENGE_TYPES.ENROL_INVITE,
        token: 'expired-invite-token',
        userId: target.id,
        expiresAt: new Date(Date.now() - 1000),
      });
      const response = await baseApp.post('/api/mfa/enrolInvite/redeem').send({
        email: target.email,
        password: TARGET_PASSWORD,
        token: expired.token,
      });
      expect(response).toHaveRequestError();
    });

    it('lets the user enrol TOTP on their own device without write Mfa', async () => {
      const { token } = await issueInvite();
      const redeemed = await baseApp.post('/api/mfa/enrolInvite/redeem').send({
        email: target.email,
        password: TARGET_PASSWORD,
        token,
      });
      const session = redeemed.body.token;

      const enrol = await baseApp
        .post('/api/mfa/enrolInvite/totp/enrol')
        .send({ enrolToken: session });
      expect(enrol).toHaveSucceeded();
      expect(enrol.body.otpauthUrl).toMatch(/^otpauth:\/\/totp\//);

      const code = OTPAuth.URI.parse(enrol.body.otpauthUrl).generate();
      const confirm = await baseApp
        .post('/api/mfa/enrolInvite/totp/confirm')
        .send({ enrolToken: session, code });
      expect(confirm).toHaveSucceeded();

      const seed = await models.TotpSecret.findOne({ where: { userId: target.id } });
      expect(seed.confirmedAt).not.toBeNull();
    });

    it('the enrol session is not a login session', async () => {
      const { token } = await issueInvite();
      const redeemed = await baseApp.post('/api/mfa/enrolInvite/redeem').send({
        email: target.email,
        password: TARGET_PASSWORD,
        token,
      });
      const session = redeemed.body.token;

      // scoped to the enrolment ceremonies only: a normal authed endpoint
      // refuses it
      const response = await baseApp
        .get('/api/mfa/methods')
        .set('authorization', `Bearer ${session}`);
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('ceremony endpoints refuse without a session token', async () => {
      const response = await baseApp.post('/api/mfa/enrolInvite/totp/enrol');
      expect(response).toHaveRequestError();
    });

    it('refuses the session for a user deactivated after redeeming', async () => {
      // deactivation via visibility_status is how users are retired in
      // practice; it must void a live enrol session too
      const victim = await models.User.create(
        fake(models.User, { password: TARGET_PASSWORD }),
      );
      const invite = await adminAgent.post(`/api/admin/users/${victim.id}/mfa/enrolInvite`);
      const redeemed = await baseApp.post('/api/mfa/enrolInvite/redeem').send({
        email: victim.email,
        password: TARGET_PASSWORD,
        token: invite.body.token,
      });
      expect(redeemed).toHaveSucceeded();

      await victim.update({ visibilityStatus: VISIBILITY_STATUSES.HISTORICAL });
      const response = await baseApp
        .post('/api/mfa/enrolInvite/totp/enrol')
        .send({ enrolToken: redeemed.body.token });
      expect(response).toHaveRequestError();
    });
  });
});
