import { DEVICE_SCOPES, SETTINGS_SCOPES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';

/**
 * The IP policy: auth.ipAllowlist (login-level gate) and auth.mfa.ipExempt
 * (skip the second factor inside trusted ranges). Supertest connects from
 * loopback, so 127.0.0.0/8 stands in for "inside" and 10.0.0.0/8 for
 * "outside".
 */
describe('IP policy', () => {
  let ctx;
  let baseApp;
  let models;

  const PASSWORD = 'ip-policy-password';

  const setGlobal = (key, value) => models.Setting.set(key, value, SETTINGS_SCOPES.GLOBAL);

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;
  });

  afterAll(() => ctx.close());

  const makeUser = async (overrides = {}) =>
    models.User.create(fake(models.User, { password: PASSWORD, ...overrides }));

  let deviceSerial = 0;
  const login = (user, extra = {}) =>
    baseApp.post('/api/login').send({
      email: user.email,
      password: PASSWORD,
      deviceId: `ip-policy-device-${(deviceSerial += 1)}`,
      ...extra,
    });

  describe('login allowlist', () => {
    afterEach(async () => {
      await setGlobal('auth.ipAllowlist', []);
    });

    it('refuses logins from outside the ranges and allows inside', async () => {
      const user = await makeUser();

      await setGlobal('auth.ipAllowlist', ['10.0.0.0/8']);
      expect(await login(user)).toBeForbidden();

      await setGlobal('auth.ipAllowlist', ['127.0.0.0/8']);
      expect(await login(user)).toHaveSucceeded();
    });

    it('an empty allowlist restricts nothing', async () => {
      const user = await makeUser();
      expect(await login(user)).toHaveSucceeded();
    });

    it('gates passwordless entry points too', async () => {
      await setGlobal('auth.ipAllowlist', ['10.0.0.0/8']);
      const response = await baseApp.post('/api/login/webauthn/assert-begin');
      expect(response).toBeForbidden();
    });
  });

  describe('MFA exemption', () => {
    beforeAll(async () => {
      await setGlobal('auth.mfa.enabled', true);
    });
    afterAll(async () => {
      await setGlobal('auth.mfa.enabled', false);
      await setGlobal('auth.mfa.ipExempt', []);
    });

    const withConfirmedTotp = async () => {
      const confirmedAt = new Date();
      const user = await makeUser({ totpConfirmedAt: confirmedAt });
      await models.TotpSecret.create({ userId: user.id, secret: 'S1:AAAA:BBBB', confirmedAt });
      return user;
    };

    it('an enrolled user is challenged off-network and exempt on it', async () => {
      const user = await withConfirmedTotp();

      await setGlobal('auth.mfa.ipExempt', []);
      const challenged = await login(user);
      expect(challenged).toHaveSucceeded();
      expect(challenged.body.mfaPending).toBeTruthy();

      await setGlobal('auth.mfa.ipExempt', ['127.0.0.0/8']);
      const exempt = await login(user);
      expect(exempt).toHaveSucceeded();
      expect(exempt.body.mfaPending).toBeUndefined();
      expect(exempt.body.token).toEqual(expect.any(String));
    });

    it('a required factorless user may skip enrolment only on the exempt network', async () => {
      const role = await models.Role.create(fake(models.Role));
      await models.Permission.create({ roleId: role.id, verb: 'require', noun: 'Mfa' });
      const user = await makeUser({ role: role.id });
      await setGlobal('auth.mfa.webauthn.rpid', 'localhost');

      // off-network: forced enrolment, not skippable
      await setGlobal('auth.mfa.ipExempt', []);
      const forced = await login(user);
      expect(forced.body.mfaPending).toMatchObject({ kind: 'enrol', skippable: false });

      // on the exempt network: still nudged to enrol, but may skip
      await setGlobal('auth.mfa.ipExempt', ['127.0.0.0/8']);
      const nudged = await login(user);
      expect(nudged.body.mfaPending).toMatchObject({ kind: 'enrol', skippable: true });

      const skipped = await baseApp
        .post('/api/mfa/login/skip')
        .send({ mfaToken: nudged.body.mfaPending.token });
      expect(skipped).toHaveSucceeded();
      expect(skipped.body.token).toEqual(expect.any(String));
    });
  });

  describe('forwarded client IP trust', () => {
    let forwarderToken;
    let plainToken;

    beforeAll(async () => {
      // a facility-like user whose role may register facility_server devices
      const facilityRole = await models.Role.create(fake(models.Role));
      await models.Permission.create({
        roleId: facilityRole.id,
        verb: 'create',
        noun: 'FacilityDevice',
      });
      const facilityUser = await makeUser({ role: facilityRole.id });
      const facilityLogin = await login(facilityUser, {
        deviceId: 'trusted-forwarder-device',
        scopes: [DEVICE_SCOPES.SYNC_CLIENT, DEVICE_SCOPES.FACILITY_SERVER],
      });
      forwarderToken = facilityLogin.body.token;

      // an ordinary user session, sync-client only
      const plainUser = await makeUser();
      const plainLogin = await login(plainUser, {
        deviceId: 'plain-device',
        scopes: [DEVICE_SCOPES.SYNC_CLIENT],
      });
      plainToken = plainLogin.body.token;
    });

    afterEach(async () => {
      await setGlobal('auth.ipAllowlist', []);
    });

    it('honours the forwarded IP from a facility_server-scoped session', async () => {
      const user = await makeUser();
      await setGlobal('auth.ipAllowlist', ['10.0.0.0/8']);

      const response = await baseApp
        .post('/api/login')
        .set('X-Tamanu-Client-Ip', '10.1.2.3')
        .set('X-Tamanu-Forwarder-Auth', forwarderToken)
        .send({ email: user.email, password: PASSWORD, deviceId: 'fwd-trust-device' });
      expect(response).toHaveSucceeded();
    });

    it('ignores the forwarded IP without a trusted forwarder credential', async () => {
      const user = await makeUser();
      await setGlobal('auth.ipAllowlist', ['10.0.0.0/8']);

      // bare header: evaluated as the connection's own (loopback) address
      const bare = await baseApp
        .post('/api/login')
        .set('X-Tamanu-Client-Ip', '10.1.2.3')
        .send({ email: user.email, password: PASSWORD, deviceId: 'fwd-trust-device' });
      expect(bare).toBeForbidden();

      // a real session whose device lacks the facility_server scope
      const wrongScope = await baseApp
        .post('/api/login')
        .set('X-Tamanu-Client-Ip', '10.1.2.3')
        .set('X-Tamanu-Forwarder-Auth', plainToken)
        .send({ email: user.email, password: PASSWORD, deviceId: 'fwd-trust-device' });
      expect(wrongScope).toBeForbidden();

      // garbage credential
      const garbage = await baseApp
        .post('/api/login')
        .set('X-Tamanu-Client-Ip', '10.1.2.3')
        .set('X-Tamanu-Forwarder-Auth', 'not-a-token')
        .send({ email: user.email, password: PASSWORD, deviceId: 'fwd-trust-device' });
      expect(garbage).toBeForbidden();
    });
  });
});
