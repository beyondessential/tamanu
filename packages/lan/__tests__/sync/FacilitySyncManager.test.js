import { inspect } from 'util';
import { sleepAsync } from 'shared/utils/sleepAsync';

import { FacilitySyncManager } from '../../app/sync/FacilitySyncManager';

describe('FacilitySyncManager', () => {
  describe('triggerSync', () => {
    afterEach(() => {
      FacilitySyncManager.restoreConfig();
    });

    it('does nothing if sync is disabled', async () => {
      FacilitySyncManager.overrideConfig({ sync: { enabled: false } });
      const syncManager = new FacilitySyncManager({
        models: {},
        sequelize: {},
        centralServer: {},
      });

      await syncManager.triggerSync();

      expect(syncManager.syncPromise).toBe(null);
    });

    it('awaits the existing sync if one is ongoing', async () => {
      FacilitySyncManager.overrideConfig({ sync: { enabled: true } });
      const syncManager = new FacilitySyncManager({
        models: {},
        sequelize: {},
        centralServer: {},
      });

      const resolveWhenNonEmpty = [];
      syncManager.syncPromise = jest.fn().mockImplementation(async () => {
        while (resolveWhenNonEmpty.length === 0) {

          await sleepAsync(5);
        }
      });

      const promise = syncManager.triggerSync();
      expect(inspect(promise)).toMatch(/pending/);
      resolveWhenNonEmpty.push(true);
      await promise;
    });
  });
});
