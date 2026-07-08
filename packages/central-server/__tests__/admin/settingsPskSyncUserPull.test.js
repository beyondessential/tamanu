import { FACT_SETTINGS_PSK } from '@tamanu/constants';
import { createTestContext } from '../utilities';

// The facility settings-PSK migration (provisionFacilitySettingsPsk) does NOT use an
// admin session — it logs in with its stored *sync* credentials and calls the admin
// endpoint with that token. syncCredentials.test.js only exercises GET /settingsPsk via
// baseApp.asRole('admin'), which fabricates an admin session and never touches /api/login
// nor a kind:'sync' user. This proves the real production path: a provisioned sync user
// (role admin, kind sync) authenticating through the real login and pulling the PSK.
const CRED_ENDPOINT = '/api/admin/syncCredentials';
const PSK_ENDPOINT = '/api/admin/settingsPsk';

describe('settings PSK — facility sync-user pull (real login + auth)', () => {
  let ctx;
  let baseApp;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    ({ models } = ctx.store);
  });
  afterAll(async () => ctx.close());

  it('a provisioned sync user can log in and pull the deployment PSK', async () => {
    const deviceId = 'psk-sync-pull-device';

    // 1. central mints sync credentials (+ the deployment PSK) for the facility
    const admin = await baseApp.asRole('admin');
    const provision = await admin
      .post(CRED_ENDPOINT)
      .send({ deviceId, facilityIds: ['facility-psk-pull'] });
    expect(provision).toHaveSucceeded();
    const { email, password, settingsPsk } = provision.body;
    expect(settingsPsk).toMatch(/^[0-9a-f]{64}$/);

    // 2. facility logs in with those sync credentials via the real login route
    const login = await baseApp.post('/api/login').send({ email, password, deviceId });
    expect(login).toHaveSucceeded();
    const { token } = login.body;
    expect(token).toEqual(expect.any(String));

    // 3. facility pulls the PSK with the sync user's own token — the assertion a
    //    mocked test can't make: kind:'sync' + role:'admin' is actually authorised here
    const pull = await baseApp.get(PSK_ENDPOINT).set('Authorization', `Bearer ${token}`);
    expect(pull).toHaveSucceeded();
    expect(pull.body.settingsPsk).toBe(settingsPsk);

    // and it really is a sync-kind user, not a regular admin
    const user = await models.User.findOne({ where: { email } });
    expect(user.kind).toBe('sync');
    expect(user.role).toBe('admin');
  });

  it('the PSK handed out matches the one stored on central', async () => {
    const admin = await baseApp.asRole('admin');
    const provision = await admin
      .post(CRED_ENDPOINT)
      .send({ deviceId: 'psk-sync-pull-device-2', facilityIds: ['facility-psk-pull-2'] });
    expect(provision).toHaveSucceeded();

    const stored = await models.LocalSystemSecret.get(FACT_SETTINGS_PSK);
    expect(stored).toMatch(/^[0-9a-f]{64}$/);
    expect(provision.body.settingsPsk).toBe(stored);
  });
});
