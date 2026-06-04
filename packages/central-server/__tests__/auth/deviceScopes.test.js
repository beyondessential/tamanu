import { DEVICE_SCOPES, SETTING_KEYS, SETTINGS_SCOPES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';

/**
 * The facility_server device scope is a trust anchor (it lets a connection
 * forward end-client IPs for the IP policy), so acquiring it — at first
 * registration or as an upgrade — requires the authenticating user's role to
 * hold the literal `create FacilityDevice` grant. Without it the request
 * degrades: the scope is dropped, the device still works as a sync client.
 */
describe('facility_server device scope', () => {
  let ctx;
  let baseApp;
  let models;

  const PASSWORD = 'device-scope-password';

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;
    // sibling suites toggle the registration quota feature; scope behaviour
    // is orthogonal to quotas, so pin it off here
    await models.Setting.set(
      SETTING_KEYS.FEATURES_DEVICE_REGISTRATION_QUOTA_ENABLED,
      false,
      SETTINGS_SCOPES.GLOBAL,
    );
  });

  afterAll(() => ctx.close());

  const makeUser = async permissions => {
    const role = await models.Role.create(fake(models.Role));
    await models.Permission.bulkCreate(
      permissions.map(([verb, noun]) => ({ roleId: role.id, verb, noun })),
    );
    return models.User.create(
      fake(models.User, { role: role.id, password: PASSWORD, deviceRegistrationQuota: 10 }),
    );
  };

  const loginWithScopes = (user, deviceId, scopes) =>
    baseApp.post('/api/login').send({ email: user.email, password: PASSWORD, deviceId, scopes });

  it('drops the scope for ungranted users instead of failing the login', async () => {
    const user = await makeUser([]);
    const response = await loginWithScopes(user, 'plain-sync-device', [
      DEVICE_SCOPES.SYNC_CLIENT,
      DEVICE_SCOPES.FACILITY_SERVER,
    ]);
    expect(response).toHaveSucceeded();

    const device = await models.Device.findByPk('plain-sync-device');
    expect(device.scopes).toEqual([DEVICE_SCOPES.SYNC_CLIENT]);
  });

  it('grants the scope at first registration with create FacilityDevice', async () => {
    const user = await makeUser([['create', 'FacilityDevice']]);
    const response = await loginWithScopes(user, 'facility-device', [
      DEVICE_SCOPES.SYNC_CLIENT,
      DEVICE_SCOPES.FACILITY_SERVER,
    ]);
    expect(response).toHaveSucceeded();

    const device = await models.Device.findByPk('facility-device');
    expect(device.scopes).toEqual(
      expect.arrayContaining([DEVICE_SCOPES.SYNC_CLIENT, DEVICE_SCOPES.FACILITY_SERVER]),
    );
  });

  it('upgrades an existing device once the grant is added', async () => {
    const user = await makeUser([]);
    // registered before the deployment opted in: sync_client only
    await loginWithScopes(user, 'upgradeable-device', [
      DEVICE_SCOPES.SYNC_CLIENT,
      DEVICE_SCOPES.FACILITY_SERVER,
    ]);
    expect((await models.Device.findByPk('upgradeable-device')).scopes).toEqual([
      DEVICE_SCOPES.SYNC_CLIENT,
    ]);

    // the deployment grants the role the permission; the next connect upgrades
    await models.Permission.create({
      roleId: user.role,
      verb: 'create',
      noun: 'FacilityDevice',
    });
    const again = await loginWithScopes(user, 'upgradeable-device', [
      DEVICE_SCOPES.SYNC_CLIENT,
      DEVICE_SCOPES.FACILITY_SERVER,
    ]);
    expect(again).toHaveSucceeded();
    expect((await models.Device.findByPk('upgradeable-device')).scopes).toEqual(
      expect.arrayContaining([DEVICE_SCOPES.SYNC_CLIENT, DEVICE_SCOPES.FACILITY_SERVER]),
    );
  });

  it('still refuses other scope expansions outright', async () => {
    const user = await makeUser([]);
    await loginWithScopes(user, 'no-upgrade-device', []);
    const response = await loginWithScopes(user, 'no-upgrade-device', [
      DEVICE_SCOPES.SYNC_CLIENT,
    ]);
    expect(response).toHaveRequestError();
  });
});
