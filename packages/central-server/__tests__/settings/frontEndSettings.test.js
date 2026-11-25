import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { SETTINGS_SCOPES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { settingsCache } from '@tamanu/settings';
import { createTestContext } from '../utilities';

const ENDPOINT = '/api/settings/frontEnd';

describe('Front-end settings', () => {
  let ctx;
  let baseApp;
  let models;
  let userApp;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;
    const user = await models.User.create(fake(models.User, { role: 'practitioner' }));
    userApp = await baseApp.asUser(user);
  });
  afterAll(async () => ctx.close());

  afterEach(async () => {
    await models.Setting.destroy({
      where: { key: ['telemetry.enabled', 'auth.restrictUsersToFacilities', 'facilityTimeZone'] },
    });
    settingsCache.reset();
  });

  it('serves the central settings when no facility is given', async () => {
    await models.Setting.set('telemetry.enabled', true);
    settingsCache.reset();

    const res = await userApp.get(ENDPOINT);
    expect(res).toHaveSucceeded();
    expect(res.body.settings.telemetry.enabled).toBe(true);
  });

  it("serves a facility's settings when one is given", async () => {
    await models.Setting.set('telemetry.enabled', true);
    const facility = await models.Facility.create(fake(models.Facility));
    await models.Setting.set(
      'facilityTimeZone',
      'Pacific/Fiji',
      SETTINGS_SCOPES.FACILITY,
      facility.id,
    );
    settingsCache.reset();

    const res = await userApp.get(ENDPOINT).query({ facilityId: facility.id });
    expect(res).toHaveSucceeded();
    expect(res.body.settings.telemetry.enabled).toBe(true);
    expect(res.body.settings.facilityTimeZone).toBe('Pacific/Fiji');
  });

  it('serves a facility the user is linked to when access is restricted', async () => {
    await models.Setting.set('auth.restrictUsersToFacilities', true);
    settingsCache.reset();
    const facility = await models.Facility.create(fake(models.Facility));
    await models.UserFacility.create({ facilityId: facility.id, userId: userApp.user.id });

    const res = await userApp.get(ENDPOINT).query({ facilityId: facility.id });
    expect(res).toHaveSucceeded();
  });

  it('rejects a facility the user cannot access', async () => {
    await models.Setting.set('auth.restrictUsersToFacilities', true);
    settingsCache.reset();
    const facility = await models.Facility.create(fake(models.Facility));

    const res = await userApp.get(ENDPOINT).query({ facilityId: facility.id });
    expect(res).toHaveRequestError();
  });

  it('rejects an unauthenticated request', async () => {
    const res = await baseApp.get(ENDPOINT);
    expect(res).toHaveRequestError();
  });

  it('rejects an empty facility', async () => {
    const res = await userApp.get(ENDPOINT).query({ facilityId: '' });
    expect(res).toHaveRequestError();
  });
});
