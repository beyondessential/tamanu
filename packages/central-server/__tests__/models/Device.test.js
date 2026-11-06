import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEVICE_SCOPES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';

import { createTestContext } from '../utilities';

const MINUTE_MS = 60 * 1000;

describe('Device', () => {
  let ctx;
  let models;
  let device;

  const setLastSeenAt = async ageMs => {
    const lastSeenAt = new Date(Date.now() - ageMs);
    await models.Device.update({ lastSeenAt }, { where: { id: device.id } });
    return lastSeenAt;
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });

  beforeEach(async () => {
    const user = await models.User.create(fake(models.User));
    device = await models.Device.create(
      fake(models.Device, { registeredById: user.id, scopes: [DEVICE_SCOPES.SYNC_CLIENT] }),
    );
  });

  afterAll(() => ctx.close());

  describe('markSeenIfStale', () => {
    it('writes when the stored last-seen time is old', async () => {
      const longAgo = await setLastSeenAt(60 * MINUTE_MS);
      const loaded = await models.Device.findByPk(device.id);

      expect(await loaded.markSeenIfStale()).toBe(true);

      const reloaded = await models.Device.findByPk(device.id);
      expect(reloaded.lastSeenAt.getTime()).toBeGreaterThan(longAgo.getTime() + 59 * MINUTE_MS);
      // the loaded instance is kept in step (by the application's clock, not the database's)
      expect(Math.abs(loaded.lastSeenAt.getTime() - reloaded.lastSeenAt.getTime())).toBeLessThan(
        5000,
      );
    });

    it('does not write when the stored last-seen time is recent', async () => {
      const recent = await setLastSeenAt(MINUTE_MS);
      const loaded = await models.Device.findByPk(device.id);
      const update = vi.spyOn(models.Device, 'update');

      try {
        expect(await loaded.markSeenIfStale()).toBe(false);
        expect(update).not.toHaveBeenCalled();
      } finally {
        update.mockRestore();
      }

      const reloaded = await models.Device.findByPk(device.id);
      expect(reloaded.lastSeenAt.getTime()).toBe(recent.getTime());
    });

    it('writes at most once for repeated calls', async () => {
      await setLastSeenAt(60 * MINUTE_MS);
      const loaded = await models.Device.findByPk(device.id);

      expect(await loaded.markSeenIfStale()).toBe(true);
      expect(await loaded.markSeenIfStale()).toBe(false);
      expect(await loaded.markSeenIfStale()).toBe(false);
    });

    it('leaves a row alone that another caller refreshed after this one loaded it', async () => {
      await setLastSeenAt(60 * MINUTE_MS);
      const loaded = await models.Device.findByPk(device.id);
      const refreshedElsewhere = await setLastSeenAt(MINUTE_MS);

      expect(await loaded.markSeenIfStale()).toBe(false);

      const reloaded = await models.Device.findByPk(device.id);
      expect(reloaded.lastSeenAt.getTime()).toBe(refreshedElsewhere.getTime());
    });
  });
});
