import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { SETTINGS_SCOPES } from '@tamanu/constants';
import { settingsCache } from '@tamanu/settings';

import { SyncTask } from '../../app/tasks/SyncTask';
import { initSyncSettings } from '../../app/sync/syncSettings';
import { createTestContext } from '../utilities';

describe('SyncTask', () => {
  let ctx;
  const facilityId = 'balwyn';

  beforeAll(async () => {
    ctx = await createTestContext();
  });

  afterEach(async () => {
    delete process.env.SYNC_ENABLED;
    await ctx.models.Setting.destroy({
      where: { key: ['sync.schedule', 'sync.jitterTime'], facilityId },
      force: true,
    });
    settingsCache.reset();
    await initSyncSettings(ctx.settings[facilityId]);
  });

  afterAll(() => ctx.close());

  it("takes its schedule and jitter from the facility's sync settings", async () => {
    await ctx.models.Setting.set(
      'sync.schedule',
      '*/5 * * * *',
      SETTINGS_SCOPES.FACILITY,
      facilityId,
    );
    await ctx.models.Setting.set('sync.jitterTime', '3s', SETTINGS_SCOPES.FACILITY, facilityId);
    settingsCache.reset();
    await initSyncSettings(ctx.settings[facilityId]);

    const task = new SyncTask({});
    expect(task.schedule).toBe('*/5 * * * *');
    expect(task.jitterTime).toBe('3s');
  });

  it('is off when SYNC_ENABLED is false', () => {
    process.env.SYNC_ENABLED = 'false';
    expect(new SyncTask({}).isEnabled).toBe(false);
  });
});
