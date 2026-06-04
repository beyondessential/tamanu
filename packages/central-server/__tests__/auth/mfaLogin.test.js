import * as OTPAuth from 'otpauth';

import { SETTINGS_SCOPES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { encryptSecret } from '@tamanu/shared/utils/crypto';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';
import { makeRoleWithPermissions } from '../permissions';

// Fixed PSK so TOTP seed encrypt/decrypt works without a real key file.
const TEST_KEY_BUFFER = Buffer.alloc(32, 0xab);
jest.mock('@tamanu/shared/utils/crypto', () => {
  const original = jest.requireActual('@tamanu/shared/utils/crypto');
  return {
    ...original,
    getSettingsPskKeyBuffer: jest.fn(async () => Buffer.alloc(32, 0xab)),
  };
});

const PASSWORD = 'login-password-1Q2Q';
const DEVICE_ID = 'test-mfa-login-device';

describe('Login with MFA', () => {
  let ctx;
  let baseApp;
  let models;

  const makeUser = async (role = 'practitioner') =>
    models.User.create(fake(models.User, { password: PASSWORD, role }));

  const login = (user, body = {}) =>
    baseApp
      .post('/api/login')
      .send({ email: user.email, password: PASSWORD, deviceId: DEVICE_ID, ...body });

  const plantConfirmedTotp = async user => {
    const totp = new OTPAuth.TOTP({ issuer: 'Tamanu', label: user.email });
    await models.TotpSecret.create({
      userId: user.id,
      secret: await encryptSecret(TEST_KEY_BUFFER, totp.secret.base32),
      confirmedAt: new Date(),
    });
    return totp;
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;

    await makeRoleWithPermissions(models, 'mfa-required-role', [
      { verb: 'require', noun: 'Mfa' },
    ]);

    await models.Setting.set('auth.mfa.enabled', true, SETTINGS_SCOPES.GLOBAL);
    await models.Setting.set('auth.mfa.webauthn.rpid', 'localhost', SETTINGS_SCOPES.GLOBAL);
  });

  afterAll(() => ctx.close());

  it('logs straight in when MFA is disabled, even with factors enrolled', async () => {
    await models.Setting.set('auth.mfa.enabled', false, SETTINGS_SCOPES.GLOBAL);
    try {
      const user = await makeUser();
      await plantConfirmedTotp(user);
      const response = await login(user);
      expect(response).toHaveSucceeded();
      expect(response.body.token).toEqual(expect.any(String));
      expect(response.body.mfaPending).toBeUndefined();
    } finally {
      await models.Setting.set('auth.mfa.enabled', true, SETTINGS_SCOPES.GLOBAL);
    }
  });

  it('logs straight in when the user has no factors and none are required', async () => {
    const user = await makeUser();
    const response = await login(user);
    expect(response).toHaveSucceeded();
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.mfaPending).toBeUndefined();
  });

  describe('challenge', () => {
    let user;
    let totp;
    let mfaToken;

    beforeAll(async () => {
      user = await makeUser();
      totp = await plantConfirmedTotp(user);
    });

    it('pauses the login and withholds tokens', async () => {
      const response = await login(user);
      expect(response).toHaveSucceeded();
      expect(response.body.token).toBeUndefined();
      expect(response.body.refreshToken).toBeUndefined();
      expect(response.body.user).toBeUndefined();
      expect(response.body.mfaPending).toMatchObject({
        kind: 'challenge',
        factors: ['totp'],
        token: expect.any(String),
      });
      mfaToken = response.body.mfaPending.token;
    });

    it('rejects a wrong code', async () => {
      const response = await baseApp
        .post('/api/mfa/login/totp')
        .send({ mfaToken, code: '000000' });
      expect(response).toHaveRequestError();
    });

    it('rejects garbage pending tokens', async () => {
      const response = await baseApp
        .post('/api/mfa/login/totp')
        .send({ mfaToken: 'bogus', code: totp.generate() });
      expect(response).toHaveRequestError();
    });

    it('refuses enrolment ceremonies on a challenge token', async () => {
      const response = await baseApp.post('/api/mfa/login/totp/enrol').send({ mfaToken });
      expect(response).toBeForbidden();
    });

    it('completes the login with a valid code', async () => {
      const response = await baseApp
        .post('/api/mfa/login/totp')
        .send({ mfaToken, code: totp.generate() });
      expect(response).toHaveSucceeded();
      expect(response.body.token).toEqual(expect.any(String));
      expect(response.body.user).toMatchObject({ id: user.id });
      expect(response.body.permissions).toEqual(expect.any(Array));

      // and the minted token is a real access token
      const whoami = await baseApp
        .get('/api/whoami')
        .set('authorization', `Bearer ${response.body.token}`);
      expect(whoami).toHaveSucceeded();
      expect(whoami.body.id).toEqual(user.id);
    });

    it('offers webauthn ceremony options when a credential exists', async () => {
      await models.WebAuthnCredential.create({
        userId: user.id,
        credentialId: `cred-${user.id}`,
        publicKey: 'dGVzdA',
        rpId: 'localhost',
      });
      const paused = await login(user);
      expect(paused.body.mfaPending.factors).toEqual(['webauthn', 'totp']);

      const begin = await baseApp
        .post('/api/mfa/login/webauthn/assert-begin')
        .send({ mfaToken: paused.body.mfaPending.token });
      expect(begin).toHaveSucceeded();
      expect(begin.body.challenge).toEqual(expect.any(String));
      expect(begin.body.allowCredentials).toHaveLength(1);
    });
  });

  describe('forced enrolment', () => {
    let user;
    let mfaToken;

    beforeAll(async () => {
      user = await makeUser('mfa-required-role');
    });

    it('pauses the login asking for enrolment, passkey first', async () => {
      const response = await login(user);
      expect(response).toHaveSucceeded();
      expect(response.body.token).toBeUndefined();
      expect(response.body.mfaPending).toMatchObject({
        kind: 'enrol',
        factors: ['webauthn', 'totp'],
        skippable: false,
        token: expect.any(String),
      });
      mfaToken = response.body.mfaPending.token;
    });

    it('refuses challenge endpoints on an enrol token', async () => {
      const response = await baseApp
        .post('/api/mfa/login/totp')
        .send({ mfaToken, code: '000000' });
      expect(response).toBeForbidden();
    });

    it('refuses /skip when the enrolment is not skippable', async () => {
      // skip is only allowed for IP-exempt users (skippable: true), which is
      // never the case until IP-exemption ships — prove the guard now, since
      // the endpoint is already reachable with a valid enrol token
      const response = await baseApp.post('/api/mfa/login/skip').send({ mfaToken });
      expect(response).toBeForbidden();
    });

    it('enrolling and confirming TOTP completes the login', async () => {
      const enrol = await baseApp.post('/api/mfa/login/totp/enrol').send({ mfaToken });
      expect(enrol).toHaveSucceeded();

      const code = OTPAuth.URI.parse(enrol.body.otpauthUrl).generate();
      const confirm = await baseApp.post('/api/mfa/login/totp/confirm').send({ mfaToken, code });
      expect(confirm).toHaveSucceeded();
      expect(confirm.body.token).toEqual(expect.any(String));
      expect(confirm.body.user).toMatchObject({ id: user.id });

      // next login is a regular challenge, not enrolment
      const next = await login(user);
      expect(next.body.mfaPending.kind).toEqual('challenge');
    });

    it('offers webauthn registration options on an enrol token', async () => {
      const required = await makeUser('mfa-required-role');
      const paused = await login(required);
      const begin = await baseApp
        .post('/api/mfa/login/webauthn/register-begin')
        .send({ mfaToken: paused.body.mfaPending.token });
      expect(begin).toHaveSucceeded();
      expect(begin.body.rp).toMatchObject({ id: 'localhost' });
      expect(begin.body.user.name).toEqual(required.email);
    });
  });

  it('refuses completion for a user deactivated mid-login', async () => {
    // users are rarely deleted; deactivation via visibility_status is the
    // real-world retirement path and must also void a pending login
    const user = await makeUser();
    const totp = await plantConfirmedTotp(user);
    const paused = await login(user);
    expect(paused.body.mfaPending).toBeTruthy();

    await user.update({ visibilityStatus: VISIBILITY_STATUSES.HISTORICAL });
    const response = await baseApp
      .post('/api/mfa/login/totp')
      .send({ mfaToken: paused.body.mfaPending.token, code: totp.generate() });
    expect(response).toHaveRequestError();
  });

  describe('blocked', () => {
    it('refuses the login outright when nothing can be verified or enrolled', async () => {
      await models.Setting.set('auth.mfa.totp.availability', 'off', SETTINGS_SCOPES.GLOBAL);
      await models.Setting.set('auth.mfa.webauthn.rpid', '', SETTINGS_SCOPES.GLOBAL);
      try {
        const user = await makeUser('mfa-required-role');
        const response = await login(user);
        expect(response).toBeForbidden();
      } finally {
        await models.Setting.set('auth.mfa.totp.availability', 'all', SETTINGS_SCOPES.GLOBAL);
        await models.Setting.set('auth.mfa.webauthn.rpid', 'localhost', SETTINGS_SCOPES.GLOBAL);
      }
    });
  });
});
