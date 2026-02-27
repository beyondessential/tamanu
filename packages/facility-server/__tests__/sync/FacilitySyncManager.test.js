import {
  FACT_CURRENT_SYNC_TICK,
  FACT_LAST_SUCCESSFUL_SYNC_PULL,
  FACT_LAST_SUCCESSFUL_SYNC_PUSH,
} from '@tamanu/constants/facts';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

import { FacilitySyncManager } from '../../dist/sync/FacilitySyncManager';
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
      syncManager.runSync = jest.fn().mockImplementation(async () => {
        return new Promise((resolve) => {
          resolveSyncPromise = async () => resolve(true);
        });
      });

      // trigger 2 syncs
      syncManager.triggerSync();
      syncManager.triggerSync();

      await sleepAsync(100);

      // assert that after 2 syncs, only 1 sync is actually run
      expect(syncManager.runSync).toHaveBeenCalledTimes(1);

      // resolve the promise of first sync
      await resolveSyncPromise();

      await sleepAsync(100);

      // assert that right after the 1st sync is finished, 2nd sync is then run
      expect(syncManager.runSync).toHaveBeenCalledTimes(2);
    });
  });

  describe('runSync', () => {
    it('clears all snapshot tables before running', async () => {
      const dropSchema = jest.fn();
      const createSchema = jest.fn();

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
          endSyncSession: jest.fn(),
        },
      });

      jest.spyOn(syncManager, 'pullChanges').mockImplementation(() => true);
      jest.spyOn(syncManager, 'pushChanges').mockImplementation(() => true);

      await syncManager.runSync();

      expect(dropSchema).toHaveBeenCalledTimes(1);
      expect(dropSchema).toHaveBeenCalledWith('sync_snapshots');
      expect(createSchema).toHaveBeenCalledTimes(1);
      expect(createSchema).toHaveBeenCalledWith('sync_snapshots', {});
    });
  });

  describe('pushChanges', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it("snapshots outgoing changes with the current 'lastSuccessfulSyncPush'", async () => {
      await ctx.models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PUSH, '10');

      jest.doMock('../../dist/sync/snapshotOutgoingChanges', () => ({
        snapshotOutgoingChanges: jest.fn().mockImplementation(() => []),
      }));

      // Have to load test function within test scope so that we can mock dependencies per test case
      const {
        FacilitySyncManager: TestFacilitySyncManager,
      } = require('../../dist/sync/FacilitySyncManager');
      const { snapshotOutgoingChanges } = require('../../dist/sync/snapshotOutgoingChanges');

      const syncManager = new TestFacilitySyncManager({
        models,
        sequelize: ctx.sequelize,
        centralServer: {
          streaming: () => false,
          startSyncSession: () => ({ sessionId: TEST_SESSION_ID, tick: 1 }),
          endSyncSession: jest.fn(),
          push: jest.fn(),
        },
      });

      await syncManager.pushChanges(TEST_SESSION_ID, 10);

      expect(snapshotOutgoingChanges).toHaveBeenCalledTimes(1);
      expect(snapshotOutgoingChanges).toHaveBeenCalledWith(ctx.sequelize, expect.any(Object), '10');
    });

    it('pushes outgoing changes with current sessionId', async () => {
      const outgoingChanges = [{ test: 'test' }];
      await ctx.models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, '10');

      jest.doMock('../../dist/sync/snapshotOutgoingChanges', () => ({
        ...jest.requireActual('../../dist/sync/snapshotOutgoingChanges'),
        snapshotOutgoingChanges: jest.fn().mockImplementation(() => outgoingChanges),
      }));
      jest.doMock('../../dist/sync/pushOutgoingChanges', () => ({
        ...jest.requireActual('../../dist/sync/pushOutgoingChanges'),
        pushOutgoingChanges: jest.fn().mockImplementation(() => true),
      }));
      jest.doMock('@tamanu/database/utils/audit', () => ({
        ...jest.requireActual('@tamanu/database/utils/audit'),
        attachChangelogToSnapshotRecords: jest.fn().mockImplementation(() => outgoingChanges),
      }));

      // Have to load test function within test scope so that we can mock dependencies per test case
      const {
        FacilitySyncManager: TestFacilitySyncManager,
      } = require('../../dist/sync/FacilitySyncManager');
      const { pushOutgoingChanges } = require('../../dist/sync/pushOutgoingChanges');
      const { attachChangelogToSnapshotRecords } = require('@tamanu/database/utils/audit');

      const syncManager = new TestFacilitySyncManager({
        models,
        sequelize: ctx.sequelize,
        centralServer: {
          streaming: () => false,
          startSyncSession: () => ({ sessionId: TEST_SESSION_ID, tick: 1 }),
          endSyncSession: jest.fn(),
          push: jest.fn(),
        },
      });

      await syncManager.pushChanges(TEST_SESSION_ID, 1);

      expect(attachChangelogToSnapshotRecords).toHaveBeenCalledTimes(1);
      expect(attachChangelogToSnapshotRecords).toHaveBeenCalledWith(
        {
          models,
          sequelize: ctx.sequelize,
        },
        outgoingChanges,
        { minSourceTick: '1' },
      );

      expect(pushOutgoingChanges).toHaveBeenCalledTimes(1);
      expect(pushOutgoingChanges).toHaveBeenCalledWith(
        syncManager.centralServer,
        TEST_SESSION_ID,
        outgoingChanges,
      );
    });
  });

  describe('pullChanges', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it("pull changes with current 'lastSuccessfulSyncPull'", async () => {
      await ctx.models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PULL, '10');

      jest.doMock('@tamanu/database/sync', () => ({
        ...jest.requireActual('@tamanu/database/sync'),
        createSnapshotTable: jest.fn(),
      }));
      jest.doMock('../../dist/sync/pullIncomingChanges', () => ({
        ...jest.requireActual('../../dist/sync/pullIncomingChanges'),
        pullIncomingChanges: jest.fn().mockImplementation(() => []),
      }));
      jest.doMock('../../dist/sync/assertIfPulledRecordsUpdatedAfterPushSnapshot', () => ({
        ...jest.requireActual('../../dist/sync/assertIfPulledRecordsUpdatedAfterPushSnapshot'),
        assertIfPulledRecordsUpdatedAfterPushSnapshot: jest.fn(),
      }));

      // Have to load test function within test scope so that we can mock dependencies per test case
      const {
        FacilitySyncManager: TestFacilitySyncManager,
      } = require('../../dist/sync/FacilitySyncManager');
      const { createSnapshotTable } = require('@tamanu/database/sync');

      const syncManager = new TestFacilitySyncManager({
        models,
        sequelize: ctx.sequelize,
        centralServer: {
          streaming: () => false,
          startSyncSession: () => ({ sessionId: TEST_SESSION_ID, tick: 1 }),
          endSyncSession: jest.fn(),
          push: jest.fn(),
        },
      });

      await syncManager.pullChanges(TEST_SESSION_ID);

      expect(createSnapshotTable).toHaveBeenCalledTimes(1);
      expect(createSnapshotTable).toHaveBeenCalledWith(ctx.sequelize, TEST_SESSION_ID);
    });

    it('save changes with current sessionId', async () => {
      await ctx.models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, '10');

      jest.doMock('@tamanu/database/sync', () => ({
        ...jest.requireActual('@tamanu/database/sync'),
        createSnapshotTable: jest.fn(),
        saveIncomingChanges: jest.fn(),
      }));
      jest.doMock('../../dist/sync/pullIncomingChanges', () => ({
        ...jest.requireActual('../../dist/sync/pullIncomingChanges'),
        pullIncomingChanges: jest.fn().mockImplementation(() => ({ totalPulled: 3, tick: 1 })),
      }));
      jest.doMock('../../dist/sync/assertIfPulledRecordsUpdatedAfterPushSnapshot', () => ({
        ...jest.requireActual('../../dist/sync/assertIfPulledRecordsUpdatedAfterPushSnapshot'),
        assertIfPulledRecordsUpdatedAfterPushSnapshot: jest.fn(),
      }));

      // Have to load test function within test scope so that we can mock dependencies per test case
      const {
        FacilitySyncManager: TestFacilitySyncManager,
      } = require('../../dist/sync/FacilitySyncManager');
      const { saveIncomingChanges } = require('@tamanu/database/sync');

      const syncManager = new TestFacilitySyncManager({
        models,
        sequelize: ctx.sequelize,
        centralServer: {
          streaming: () => false,
          startSyncSession: () => ({ sessionId: TEST_SESSION_ID, tick: 1 }),
          endSyncSession: jest.fn(),
          push: jest.fn(),
        },
      });

      await syncManager.pullChanges(TEST_SESSION_ID);

      expect(saveIncomingChanges).toHaveBeenCalledTimes(1);
      expect(saveIncomingChanges).toHaveBeenCalledWith(
        ctx.sequelize,
        expect.any(Object),
        TEST_SESSION_ID,
      );
    });
  });
});
