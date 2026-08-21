import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FACT_CURRENT_SYNC_TICK,
  FACT_DEVICE_ID,
  FACT_FACILITY_IDS,
  FACT_LAST_SUCCESSFUL_SYNC_PULL,
  FACT_LAST_SUCCESSFUL_SYNC_PUSH,
  FACT_SETTINGS_PSK,
} from '@tamanu/constants/facts';
import { USER_KINDS } from '@tamanu/constants';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

import { FacilitySyncManager } from '../../app/sync/FacilitySyncManager';
import { createTestContext } from '../utilities';

describe('FacilitySyncManager', () => {
  let ctx;
  let models;
  const TEST_SESSION_ID = 'sync123';

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
  });

  afterAll(() => ctx.close());

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

      expect(syncManager.currentSyncPromise).toBe(null);
    });

    it('runs next sync immediately after current sync finishes when triggering sync while another sync is running', async () => {
      FacilitySyncManager.overrideConfig({ sync: { enabled: true } });
      const syncManager = new FacilitySyncManager({
        models: {},
        sequelize: {},
        centralServer: {},
      });

      let resolveSyncPromise;

      // set up promise so that sync cannot be finished until promise is resolved
      syncManager.runSync = vi.fn().mockImplementation(async () => {
        return new Promise(resolve => {
          resolveSyncPromise = async () => resolve(true);
        });
      });

      // trigger 2 syncs
      syncManager.triggerSync();
      syncManager.triggerSync();

      await sleepAsync(100);

      // assert that after 2 syncs, only 1 sync is actually run
      expect(syncManager.runSync).toBeCalledTimes(1);

      // resolve the promise of first sync
      await resolveSyncPromise();

      await sleepAsync(100);

      // assert that right after the 1st sync is finished, 2nd sync is then run
      expect(syncManager.runSync).toBeCalledTimes(2);
    });
  });

  describe('runSync', () => {
    it('clears all snapshot tables before running', async () => {
      const dropSchema = vi.fn();
      const createSchema = vi.fn();

      const syncManager = new FacilitySyncManager({
        models,
        sequelize: {
          getQueryInterface: () => ({
            dropSchema,
            createSchema,
          }),
          query: () => true,
        },
        centralServer: {
          streaming: () => false,
          startSyncSession: () => ({ sessionId: TEST_SESSION_ID, tick: 1 }),
          endSyncSession: vi.fn(),
        },
      });

      vi.spyOn(syncManager, 'pullChanges').mockImplementation(() => true);
      vi.spyOn(syncManager, 'pushChanges').mockImplementation(() => true);

      await syncManager.runSync();

      expect(dropSchema).toBeCalledTimes(1);
      expect(dropSchema).toBeCalledWith('sync_snapshots');
      expect(createSchema).toBeCalledTimes(1);
      expect(createSchema).toBeCalledWith('sync_snapshots', {});
    });

    describe('provisioning that needs central', () => {
      const makeSyncManager = (centralServerOverrides, facts = {}) => {
        const secretStore = new Map();
        const factStore = new Map(Object.entries(facts));
        const syncManager = new FacilitySyncManager({
          models: {
            LocalSystemFact: {
              get: async key => factStore.get(key) ?? null,
              set: async (key, value) => void factStore.set(key, value),
            },
            LocalSystemSecret: {
              get: async key => secretStore.get(key) ?? null,
              set: async (key, value) => void secretStore.set(key, value),
              setIfAbsent: async (key, value) => {
                if (!secretStore.has(key)) secretStore.set(key, value);
              },
            },
          },
          sequelize: {
            getQueryInterface: () => ({ dropSchema: vi.fn(), createSchema: vi.fn() }),
            query: () => true,
            transaction: async callback => callback(),
          },
          centralServer: {
            streaming: () => false,
            startSyncSession: () => ({ sessionId: TEST_SESSION_ID, tick: 1 }),
            endSyncSession: vi.fn(),
            setToken: vi.fn(),
            ...centralServerOverrides,
          },
        });
        vi.spyOn(syncManager, 'pullChanges').mockImplementation(() => true);
        vi.spyOn(syncManager, 'pushChanges').mockImplementation(() => true);
        return { syncManager, secretStore, factStore };
      };

      it('pulls the PSK once the session has completed', async () => {
        const psk = 'ab'.repeat(32);
        const fetch = vi.fn(async () => ({ settingsPsk: psk }));
        const { syncManager, secretStore } = makeSyncManager({ fetch });

        await syncManager.runSync();

        expect(fetch).toHaveBeenCalledWith('admin/settingsPsk');
        expect(secretStore.get(FACT_SETTINGS_PSK)).toBe(psk);
      });

      it('completes the sync even when the pull fails', async () => {
        const fetch = vi.fn(async () => {
          throw new Error('central unreachable');
        });
        const { syncManager, secretStore } = makeSyncManager({ fetch });

        await expect(syncManager.runSync()).resolves.toEqual({ queued: false, ran: true });
        expect(secretStore.has(FACT_SETTINGS_PSK)).toBe(false);
      });

      // Central serves the PSK to a dedicated sync user only, so a facility still on
      // config credentials has to swap first or the read is refused. Provisioning also
      // returns the PSK, and taking it there would skip the read, and with it the key
      // buffer drop that gets a running process off a stale key.
      it('swaps the sync user and still reads the PSK', async () => {
        const psk = 'ab'.repeat(32);
        const fetch = vi.fn(async endpoint =>
          endpoint === 'admin/syncCredentials'
            ? { email: 'sync.abc@sync.tamanu', password: 'minted', settingsPsk: psk }
            : { settingsPsk: psk },
        );
        const { syncManager } = makeSyncManager(
          { fetch, user: { kind: USER_KINDS.USER } },
          {
            [FACT_DEVICE_ID]: 'device-1',
            [FACT_FACILITY_IDS]: JSON.stringify(['facility-a']),
          },
        );

        await syncManager.runSync();

        expect(fetch.mock.calls.map(([endpoint]) => endpoint)).toEqual([
          'admin/syncCredentials',
          'admin/settingsPsk',
        ]);
      });

      it('completes the sync even when the swap fails', async () => {
        const fetch = vi.fn(async endpoint => {
          if (endpoint === 'admin/syncCredentials') throw new Error('central refused');
          return { settingsPsk: 'ab'.repeat(32) };
        });
        const { syncManager } = makeSyncManager(
          { fetch, user: { kind: USER_KINDS.USER } },
          {
            [FACT_DEVICE_ID]: 'device-1',
            [FACT_FACILITY_IDS]: JSON.stringify(['facility-a']),
          },
        );

        await expect(syncManager.runSync()).resolves.toEqual({ queued: false, ran: true });
      });
    });
  });

  describe('pushChanges', () => {
    beforeEach(() => {
      vi.resetModules();
    });

    it("snapshots outgoing changes with the current 'lastSuccessfulSyncPush'", async () => {
      await ctx.models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PUSH, '10');

      vi.doMock('../../app/sync/snapshotOutgoingChanges', () => ({
        snapshotOutgoingChanges: vi.fn().mockImplementation(() => []),
      }));

      // Imported inside the test so the doMock above is in place before the module is evaluated
      const {
        FacilitySyncManager: TestFacilitySyncManager,
      } = await import('../../app/sync/FacilitySyncManager');
      const { snapshotOutgoingChanges } = await import('../../app/sync/snapshotOutgoingChanges');

      const syncManager = new TestFacilitySyncManager({
        models,
        sequelize: ctx.sequelize,
        centralServer: {
          streaming: () => false,
          startSyncSession: () => ({ sessionId: TEST_SESSION_ID, tick: 1 }),
          endSyncSession: vi.fn(),
          push: vi.fn(),
        },
      });

      await syncManager.pushChanges(TEST_SESSION_ID, 10);

      expect(snapshotOutgoingChanges).toBeCalledTimes(1);
      expect(snapshotOutgoingChanges).toBeCalledWith(ctx.sequelize, expect.any(Object), '10');
    });

    it('pushes outgoing changes with current sessionId', async () => {
      const outgoingChanges = [{ test: 'test' }];
      await ctx.models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, '10');

      vi.doMock('../../app/sync/snapshotOutgoingChanges', async () => ({
        ...(await vi.importActual('../../app/sync/snapshotOutgoingChanges')),
        snapshotOutgoingChanges: vi.fn().mockImplementation(() => outgoingChanges),
      }));
      vi.doMock('../../app/sync/pushOutgoingChanges', async () => ({
        ...(await vi.importActual('../../app/sync/pushOutgoingChanges')),
        pushOutgoingChanges: vi.fn().mockImplementation(() => true),
      }));
      vi.doMock('@tamanu/database/utils/audit', async () => ({
        ...(await vi.importActual('@tamanu/database/utils/audit')),
        attachChangelogToSnapshotRecords: vi.fn().mockImplementation(() => outgoingChanges),
      }));

      // Imported inside the test so the doMock above is in place before the module is evaluated
      const {
        FacilitySyncManager: TestFacilitySyncManager,
      } = await import('../../app/sync/FacilitySyncManager');
      const { pushOutgoingChanges } = await import('../../app/sync/pushOutgoingChanges');
      const { attachChangelogToSnapshotRecords } = await import('@tamanu/database/utils/audit');

      const syncManager = new TestFacilitySyncManager({
        models,
        sequelize: ctx.sequelize,
        centralServer: {
          streaming: () => false,
          startSyncSession: () => ({ sessionId: TEST_SESSION_ID, tick: 1 }),
          endSyncSession: vi.fn(),
          push: vi.fn(),
        },
      });

      await syncManager.pushChanges(TEST_SESSION_ID, 1);

      expect(attachChangelogToSnapshotRecords).toBeCalledTimes(1);
      expect(attachChangelogToSnapshotRecords).toBeCalledWith(
        {
          models,
          sequelize: ctx.sequelize,
        },
        outgoingChanges,
        { minSourceTick: '1' },
      );

      expect(pushOutgoingChanges).toBeCalledTimes(1);
      expect(pushOutgoingChanges).toBeCalledWith(
        syncManager.centralServer,
        TEST_SESSION_ID,
        outgoingChanges,
      );
    });
  });

  describe('pullChanges', () => {
    beforeEach(() => {
      vi.resetModules();
    });

    it("pull changes with current 'lastSuccessfulSyncPull'", async () => {
      await ctx.models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PULL, '10');

      vi.doMock('@tamanu/database/sync', async () => ({
        ...(await vi.importActual('@tamanu/database/sync')),
        createSnapshotTable: vi.fn(),
      }));
      vi.doMock('../../app/sync/pullIncomingChanges', async () => ({
        ...(await vi.importActual('../../app/sync/pullIncomingChanges')),
        pullIncomingChanges: vi.fn().mockImplementation(() => []),
      }));
      vi.doMock('../../app/sync/assertIfPulledRecordsUpdatedAfterPushSnapshot', async () => ({
        ...(await vi.importActual('../../app/sync/assertIfPulledRecordsUpdatedAfterPushSnapshot')),
        assertIfPulledRecordsUpdatedAfterPushSnapshot: vi.fn(),
      }));

      // Imported inside the test so the doMock above is in place before the module is evaluated
      const {
        FacilitySyncManager: TestFacilitySyncManager,
      } = await import('../../app/sync/FacilitySyncManager');
      const { createSnapshotTable } = await import('@tamanu/database/sync');

      const syncManager = new TestFacilitySyncManager({
        models,
        sequelize: ctx.sequelize,
        centralServer: {
          streaming: () => false,
          startSyncSession: () => ({ sessionId: TEST_SESSION_ID, tick: 1 }),
          endSyncSession: vi.fn(),
          push: vi.fn(),
        },
      });

      await syncManager.pullChanges(TEST_SESSION_ID);

      expect(createSnapshotTable).toBeCalledTimes(1);
      expect(createSnapshotTable).toBeCalledWith(ctx.sequelize, TEST_SESSION_ID);
    });

    it('save changes with current sessionId', async () => {
      await ctx.models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, '10');

      vi.doMock('@tamanu/database/sync', async () => ({
        ...(await vi.importActual('@tamanu/database/sync')),
        createSnapshotTable: vi.fn(),
        saveIncomingChanges: vi.fn(),
      }));
      vi.doMock('../../app/sync/pullIncomingChanges', async () => ({
        ...(await vi.importActual('../../app/sync/pullIncomingChanges')),
        pullIncomingChanges: vi.fn().mockImplementation(() => ({ totalPulled: 3, tick: 1 })),
      }));
      vi.doMock('../../app/sync/assertIfPulledRecordsUpdatedAfterPushSnapshot', async () => ({
        ...(await vi.importActual('../../app/sync/assertIfPulledRecordsUpdatedAfterPushSnapshot')),
        assertIfPulledRecordsUpdatedAfterPushSnapshot: vi.fn(),
      }));

      // Imported inside the test so the doMock above is in place before the module is evaluated
      const {
        FacilitySyncManager: TestFacilitySyncManager,
      } = await import('../../app/sync/FacilitySyncManager');
      const { saveIncomingChanges } = await import('@tamanu/database/sync');

      const syncManager = new TestFacilitySyncManager({
        models,
        sequelize: ctx.sequelize,
        centralServer: {
          streaming: () => false,
          startSyncSession: () => ({ sessionId: TEST_SESSION_ID, tick: 1 }),
          endSyncSession: vi.fn(),
          push: vi.fn(),
        },
      });

      await syncManager.pullChanges(TEST_SESSION_ID);

      expect(saveIncomingChanges).toBeCalledTimes(1);
      expect(saveIncomingChanges).toBeCalledWith(
        ctx.sequelize,
        expect.any(Object),
        TEST_SESSION_ID,
      );
    });
  });
});
