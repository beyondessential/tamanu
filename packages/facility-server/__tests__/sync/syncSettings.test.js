import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SETTINGS_SCOPES } from '@tamanu/constants';
import { facilityDefaults, settingsCache } from '@tamanu/settings';

import { getSyncSettings, initSyncSettings } from '../../app/sync/syncSettings';
import { createTestContext } from '../utilities';

describe('syncSettings', () => {
  let ctx;
  let models;
  const facilityId = 'balwyn';

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
  });

  afterAll(async () => {
    await models.Setting.destroy({
      where: { key: 'sync.timeout', facilityId },
      force: true,
    });
    settingsCache.reset();
    await initSyncSettings(ctx.settings[facilityId]);
    await ctx.close();
  });

  it('serves the config value when no setting is recorded', async () => {
    settingsCache.reset();
    await initSyncSettings(ctx.settings[facilityId]);
    expect(getSyncSettings().backoff).toEqual({ maxAttempts: 1, multiplierMs: 0, maxWaitMs: 0 });
    expect(getSyncSettings().timeout).toBe(facilityDefaults.sync.timeout);
  });

  it('prefers the recorded facility setting', async () => {
    await models.Setting.set('sync.timeout', 20000, SETTINGS_SCOPES.FACILITY, facilityId);
    settingsCache.reset();
    await initSyncSettings(ctx.settings[facilityId]);
    expect(getSyncSettings().timeout).toBe(20000);
  });

  it('falls back to config and defaults without a facility', async () => {
    await initSyncSettings(undefined);
    expect(getSyncSettings().schedule).toBe(facilityDefaults.sync.schedule);
    expect(getSyncSettings().backoff.maxAttempts).toBe(1);
  });
});
