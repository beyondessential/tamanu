import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FACT_CURRENT_SYNC_TICK,
  FACT_DEVICE_ID,
  FACT_FACILITY_IDS,
  FACT_LAST_SUCCESSFUL_SYNC_PULL,
  FACT_LAST_SUCCESSFUL_SYNC_PUSH,
  FACT_SETTINGS_PSK,
  FACT_SYNC_EMAIL,
} from '@tamanu/constants/facts';
import { SYNC_FACILITY_RUN_STATUSES, SYNC_TRIGGER_TYPES, USER_KINDS } from '@tamanu/constants';
import { fakeReferenceData } from '@tamanu/fake-data/fake';
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
            SyncFacilityRun: {
              create: async () => ({ update: vi.fn(), complete: vi.fn() }),
            },
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

  describe('sync run history', () => {
    const makeSyncManager = centralServerOverrides => {
      const syncManager = new FacilitySyncManager({
        models,
        sequelize: {
          getQueryInterface: () => ({ dropSchema: vi.fn(), createSchema: vi.fn() }),
          query: () => true,
        },
        centralServer: {
          streaming: () => false,
          startSyncSession: () => ({ sessionId: TEST_SESSION_ID, tick: 1 }),
          endSyncSession: vi.fn(),
          markSessionErrored: vi.fn(),
          ...centralServerOverrides,
        },
      });
      vi.spyOn(syncManager, 'pullChanges').mockImplementation(() => true);
      vi.spyOn(syncManager, 'pushChanges').mockImplementation(() => true);
      // Provisioning after the session is covered above and isn't under test here
      syncManager.centralServer.fetch = vi.fn(async () => ({}));
      return syncManager;
    };

    const latestSyncRun = () => models.SyncFacilityRun.findOne({ order: [['startTime', 'DESC']] });

    beforeEach(async () => {
      await models.SyncFacilityRun.destroy({ where: {}, force: true });
    });

    it('records a successful run with its session and trigger', async () => {
      const syncManager = makeSyncManager();

      await syncManager.triggerSync({ type: 'scheduled', urgent: false });

      const syncRun = await latestSyncRun();
      expect(syncRun).toMatchObject({
        status: SYNC_FACILITY_RUN_STATUSES.SUCCEEDED,
        sessionId: TEST_SESSION_ID,
        triggerType: 'scheduled',
        urgent: false,
        error: null,
      });
      expect(syncRun.completedAt).toBeInstanceOf(Date);
    });

    it('keeps only the type of the trigger reason', async () => {
      const syncManager = makeSyncManager();

      await syncManager.triggerSync({
        type: 'userRequested',
        urgent: true,
        userId: 'user-1',
        userEmail: 'someone@example.com',
      });

      const syncRun = await latestSyncRun();
      expect(syncRun).toMatchObject({ triggerType: 'userRequested', urgent: true });
    });

    it('records a queued run without a session', async () => {
      const syncManager = makeSyncManager({
        startSyncSession: () => ({ status: 'waitingInQueue' }),
      });

      await syncManager.triggerSync({ type: 'scheduled' });

      const syncRun = await latestSyncRun();
      expect(syncRun).toMatchObject({ status: SYNC_FACILITY_RUN_STATUSES.QUEUED, sessionId: null });
      expect(syncRun.completedAt).toBeInstanceOf(Date);
    });

    it('records a failed run with its error and still throws', async () => {
      const syncManager = makeSyncManager();
      syncManager.pullChanges.mockImplementation(async () => {
        throw new Error('pull exploded');
      });

      await expect(syncManager.triggerSync({ type: 'scheduled' })).rejects.toThrow('pull exploded');

      const syncRun = await latestSyncRun();
      expect(syncRun).toMatchObject({
        status: SYNC_FACILITY_RUN_STATUSES.FAILED,
        sessionId: TEST_SESSION_ID,
        error: 'pull exploded',
      });
      expect(syncRun.completedAt).toBeInstanceOf(Date);
    });

    it('records the run as running while it is in progress', async () => {
      const syncManager = makeSyncManager();
      let finishPull;
      syncManager.pullChanges.mockImplementation(
        () =>
          new Promise(resolve => {
            finishPull = resolve;
          }),
      );

      const syncPromise = syncManager.triggerSync({ type: 'scheduled' });
      await vi.waitFor(() => expect(finishPull).toBeDefined());

      const runningSyncRun = await latestSyncRun();
      expect(runningSyncRun).toMatchObject({
        status: SYNC_FACILITY_RUN_STATUSES.RUNNING,
        sessionId: TEST_SESSION_ID,
        completedAt: null,
      });

      finishPull();
      await syncPromise;
      expect(await latestSyncRun()).toMatchObject({ status: SYNC_FACILITY_RUN_STATUSES.SUCCEEDED });
    });

    it('completes the sync even when its outcome cannot be recorded', async () => {
      const syncManager = makeSyncManager();
      const complete = vi
        .spyOn(models.SyncFacilityRun.prototype, 'complete')
        .mockRejectedValue(new Error('db unavailable'));

      try {
        await expect(syncManager.triggerSync({ type: 'scheduled' })).resolves.toMatchObject({
          ran: true,
        });
        expect(await latestSyncRun()).toMatchObject({ status: SYNC_FACILITY_RUN_STATUSES.RUNNING });
      } finally {
        complete.mockRestore();
      }
    });

    it('completes the sync, without erroring the session, when its progress cannot be recorded', async () => {
      const syncManager = makeSyncManager();
      const update = vi
        .spyOn(models.SyncFacilityRun.prototype, 'update')
        .mockRejectedValue(new Error('db unavailable'));

      try {
        await expect(syncManager.triggerSync({ type: 'scheduled' })).resolves.toMatchObject({
          ran: true,
        });
        expect(syncManager.centralServer.markSessionErrored).not.toHaveBeenCalled();
      } finally {
        update.mockRestore();
      }
    });

    it('records one run per sync, not per caller waiting on it', async () => {
      const syncManager = makeSyncManager();
      let finishPull;
      syncManager.pullChanges.mockImplementationOnce(
        () =>
          new Promise(resolve => {
            finishPull = resolve;
          }),
      );

      const first = syncManager.triggerSync({ type: 'scheduled' });
      await vi.waitFor(() => expect(finishPull).toBeDefined());
      // Two callers during a running sync share the single follow-up sync
      const second = syncManager.triggerSync({ type: 'userRequested' });
      const third = syncManager.triggerSync({ type: 'userRequested' });
      finishPull();
      await Promise.all([first, second, third]);

      expect(await models.SyncFacilityRun.count()).toBe(2);
    });
  });

  // spec: SYNCHK#facility-servers
  describe('changes-pending check', () => {
    const SYNC_EMAIL = 'sync.abc@sync.tamanu';
    const PULL_CURSOR = '50';
    const scheduled = { type: SYNC_TRIGGER_TYPES.SCHEDULED, urgent: false };

    let originalPullCursor;
    let originalPushCursor;
    let originalSyncTick;
    let pskSpy;

    const makeSyncManager = centralServerOverrides => {
      const syncManager = new FacilitySyncManager({
        models,
        sequelize: {
          getQueryInterface: () => ({ dropSchema: vi.fn(), createSchema: vi.fn() }),
          query: () => true,
        },
        centralServer: {
          streaming: () => false,
          user: { kind: USER_KINDS.SYNC, email: SYNC_EMAIL },
          loginData: vi.fn(async () => ({})),
          checkChangesPending: vi.fn(async () => false),
          startSyncSession: vi.fn(async () => ({ sessionId: TEST_SESSION_ID, startedAtTick: 1 })),
          endSyncSession: vi.fn(),
          markSessionErrored: vi.fn(),
          fetch: vi.fn(async () => ({})),
          ...centralServerOverrides,
        },
      });
      vi.spyOn(syncManager, 'pullChanges').mockImplementation(() => true);
      vi.spyOn(syncManager, 'pushChanges').mockImplementation(() => true);
      syncManager.hasBootstrapped = true;
      return syncManager;
    };

    const latestSyncRun = () => models.SyncFacilityRun.findOne({ order: [['startTime', 'DESC']] });

    // Moves the local clock on and marks everything so far as pushed, so there is nothing to push
    const markEverythingPushed = async () => {
      const tick = await models.LocalSystemFact.incrementValue(FACT_CURRENT_SYNC_TICK);
      await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PUSH, String(tick));
    };

    beforeEach(async () => {
      originalPullCursor = await models.LocalSystemFact.get(FACT_LAST_SUCCESSFUL_SYNC_PULL);
      originalPushCursor = await models.LocalSystemFact.get(FACT_LAST_SUCCESSFUL_SYNC_PUSH);
      originalSyncTick = await models.LocalSystemFact.get(FACT_CURRENT_SYNC_TICK);
      await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PULL, PULL_CURSOR);
      await markEverythingPushed();
      pskSpy = vi.spyOn(models.LocalSystemSecret, 'get').mockResolvedValue('ab'.repeat(32));
      await models.SyncFacilityRun.destroy({ where: {}, force: true });
    });

    afterEach(async () => {
      pskSpy.mockRestore();
      await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PULL, originalPullCursor);
      await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PUSH, originalPushCursor);
      await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, originalSyncTick);
    });

    describe('when central answers there is nothing to pull', () => {
      it('records the run as up to date, with no session', async () => {
        const syncManager = makeSyncManager();

        const result = await syncManager.triggerSync(scheduled);

        expect(result).toMatchObject({ enabled: true, ran: true, upToDate: true });
        expect(syncManager.centralServer.startSyncSession).not.toHaveBeenCalled();
        const syncRun = await latestSyncRun();
        expect(syncRun).toMatchObject({
          status: SYNC_FACILITY_RUN_STATUSES.UP_TO_DATE,
          sessionId: null,
          triggerType: SYNC_TRIGGER_TYPES.SCHEDULED,
          error: null,
        });
        expect(syncRun.completedAt).toBeInstanceOf(Date);
      });

      it('moves the last successful sync time but not the pull cursor', async () => {
        const syncManager = makeSyncManager();
        expect(syncManager.lastCompletedAt).toBe(0);

        await syncManager.triggerSync(scheduled);

        expect(syncManager.lastCompletedAt).toBeInstanceOf(Date);
        expect(await models.LocalSystemFact.get(FACT_LAST_SUCCESSFUL_SYNC_PULL)).toBe(PULL_CURSOR);
        expect(syncManager.pullChanges).not.toHaveBeenCalled();
      });
    });

    describe('when central answers there are changes to pull', () => {
      it('sends the pull cursor with the check, and opens a session', async () => {
        const syncManager = makeSyncManager({ checkChangesPending: vi.fn(async () => true) });

        await syncManager.triggerSync(scheduled);

        expect(syncManager.centralServer.checkChangesPending).toHaveBeenCalledWith(Number(PULL_CURSOR));
        expect(syncManager.centralServer.startSyncSession).toHaveBeenCalledTimes(1);
        expect(syncManager.pullChanges).toHaveBeenCalledTimes(1);
        expect(await latestSyncRun()).toMatchObject({
          status: SYNC_FACILITY_RUN_STATUSES.SUCCEEDED,
          sessionId: TEST_SESSION_ID,
        });
      });

      it.each([
        ['has never pulled', null],
        ['has a pull cursor of -1', '-1'],
      ])('leaves the cursor out of the check when the facility %s', async (_, cursor) => {
        await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PULL, cursor);
        const syncManager = makeSyncManager({ checkChangesPending: vi.fn(async () => true) });

        await syncManager.triggerSync(scheduled);

        expect(syncManager.centralServer.checkChangesPending).toHaveBeenCalledWith(undefined);
        expect(syncManager.centralServer.startSyncSession).toHaveBeenCalledTimes(1);
      });
    });

    describe('when the check cannot be answered', () => {
      it('is a failed sync, with no session opened', async () => {
        const syncManager = makeSyncManager({
          checkChangesPending: vi.fn(async () => {
            throw new Error('central unreachable');
          }),
        });

        await expect(syncManager.triggerSync(scheduled)).rejects.toThrow('central unreachable');

        expect(syncManager.centralServer.startSyncSession).not.toHaveBeenCalled();
        const syncRun = await latestSyncRun();
        expect(syncRun).toMatchObject({
          status: SYNC_FACILITY_RUN_STATUSES.FAILED,
          error: 'central unreachable',
        });
        expect(syncRun.completedAt).toBeInstanceOf(Date);
        expect(syncManager.lastCompletedAt).toBe(0);
      });
    });

    describe('opens a session without checking', () => {
      const expectSessionWithoutCheck = async (syncManager, reason) => {
        await syncManager.triggerSync(reason);

        expect(syncManager.centralServer.checkChangesPending).not.toHaveBeenCalled();
        expect(syncManager.centralServer.startSyncSession).toHaveBeenCalledTimes(1);
        expect(await latestSyncRun()).toMatchObject({
          status: SYNC_FACILITY_RUN_STATUSES.SUCCEEDED,
          sessionId: TEST_SESSION_ID,
        });
      };

      it('when the facility has local changes to push', async () => {
        const tick = await models.LocalSystemFact.incrementValue(FACT_CURRENT_SYNC_TICK);
        await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PUSH, String(tick - 1));
        const row = await models.ReferenceData.create(fakeReferenceData());

        try {
          await expectSessionWithoutCheck(makeSyncManager(), scheduled);
        } finally {
          // the local clock is reset after each test, which must not leave a row ahead of it
          await row.destroy({ force: true });
        }
      });

      it('when the facility has not yet obtained the settings PSK', async () => {
        pskSpy.mockResolvedValue(null);

        await expectSessionWithoutCheck(makeSyncManager(), scheduled);
      });

      it('when the facility still syncs as a user other than its sync user', async () => {
        const syncManager = makeSyncManager({
          user: { kind: USER_KINDS.USER, email: 'someone@example.com' },
        });

        await expectSessionWithoutCheck(syncManager, scheduled);
      });

      it.each([
        ['a user asks for the sync', { type: SYNC_TRIGGER_TYPES.USER_REQUESTED, urgent: true }],
        [
          'a patient is marked for sync',
          { type: SYNC_TRIGGER_TYPES.PATIENT_MARKED_FOR_SYNC, urgent: true },
        ],
        ['the sync subcommand runs', { type: SYNC_TRIGGER_TYPES.SUBCOMMAND, urgent: true }],
        ['a follow-up sync runs for callers that arrived mid-sync', null],
      ])('when %s', async (_, reason) => {
        await expectSessionWithoutCheck(makeSyncManager(), reason);
      });
    });

    it('checks when the sync user has already been swapped for the dedicated one', async () => {
      // central reports the legacy account, but the facts already record a different one: the
      // swap happened and this process is only behind, so there is nothing left to converge
      await models.LocalSystemFact.set(FACT_SYNC_EMAIL, SYNC_EMAIL);
      const syncManager = makeSyncManager({
        user: { kind: USER_KINDS.USER, email: 'legacy@example.com' },
      });

      try {
        await syncManager.triggerSync(scheduled);
      } finally {
        await models.LocalSystemFact.set(FACT_SYNC_EMAIL, null);
      }

      expect(syncManager.centralServer.checkChangesPending).toHaveBeenCalledTimes(1);
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
      const { FacilitySyncManager: TestFacilitySyncManager } =
        await import('../../app/sync/FacilitySyncManager');
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
      const { FacilitySyncManager: TestFacilitySyncManager } =
        await import('../../app/sync/FacilitySyncManager');
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
      const { FacilitySyncManager: TestFacilitySyncManager } =
        await import('../../app/sync/FacilitySyncManager');
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

      await syncManager.pullChanges(TEST_SESSION_ID, { update: vi.fn() });

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
      const { FacilitySyncManager: TestFacilitySyncManager } =
        await import('../../app/sync/FacilitySyncManager');
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

      await syncManager.pullChanges(TEST_SESSION_ID, { update: vi.fn() });

      expect(saveIncomingChanges).toBeCalledTimes(1);
      expect(saveIncomingChanges).toBeCalledWith(
        ctx.sequelize,
        expect.any(Object),
        TEST_SESSION_ID,
      );
    });

    it('records when persisting pulled changes starts and completes', async () => {
      const syncRun = await models.SyncFacilityRun.create({});
      let persistStartedAtSeenOutsideTransaction;

      vi.doMock('@tamanu/database/sync', async () => ({
        ...(await vi.importActual('@tamanu/database/sync')),
        createSnapshotTable: vi.fn(),
        saveIncomingChanges: vi.fn().mockImplementation(async () => {
          // transaction: null reads outside the save transaction, as alerting would
          const runDuringSave = await models.SyncFacilityRun.findByPk(syncRun.id, {
            transaction: null,
          });
          persistStartedAtSeenOutsideTransaction = runDuringSave.persistStartedAt;
          expect(runDuringSave.persistCompletedAt).toBeNull();
        }),
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
      const { FacilitySyncManager: TestFacilitySyncManager } =
        await import('../../app/sync/FacilitySyncManager');

      const syncManager = new TestFacilitySyncManager({
        models,
        sequelize: ctx.sequelize,
        centralServer: { streaming: () => false },
      });

      await syncManager.pullChanges(TEST_SESSION_ID, syncRun);

      await syncRun.reload();
      expect(persistStartedAtSeenOutsideTransaction).toBeInstanceOf(Date);
      expect(syncRun.persistCompletedAt.getTime()).toBeGreaterThanOrEqual(
        syncRun.persistStartedAt.getTime(),
      );
    });

    it('keeps the saved changes when the persist completion cannot be recorded', async () => {
      await ctx.models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PULL, '10');

      vi.doMock('@tamanu/database/sync', async () => ({
        ...(await vi.importActual('@tamanu/database/sync')),
        createSnapshotTable: vi.fn(),
        saveIncomingChanges: vi.fn(),
      }));
      vi.doMock('../../app/sync/pullIncomingChanges', async () => ({
        ...(await vi.importActual('../../app/sync/pullIncomingChanges')),
        pullIncomingChanges: vi.fn().mockImplementation(() => ({ totalPulled: 3, pullUntil: 20 })),
      }));
      vi.doMock('../../app/sync/assertIfPulledRecordsUpdatedAfterPushSnapshot', async () => ({
        ...(await vi.importActual('../../app/sync/assertIfPulledRecordsUpdatedAfterPushSnapshot')),
        assertIfPulledRecordsUpdatedAfterPushSnapshot: vi.fn(),
      }));

      // Imported inside the test so the doMock above is in place before the module is evaluated
      const { FacilitySyncManager: TestFacilitySyncManager } =
        await import('../../app/sync/FacilitySyncManager');

      const syncManager = new TestFacilitySyncManager({
        models,
        sequelize: ctx.sequelize,
        centralServer: { streaming: () => false },
      });
      const syncRun = {
        update: vi.fn(async fields => {
          if ('persistCompletedAt' in fields) throw new Error('db unavailable');
        }),
      };

      await expect(syncManager.pullChanges(TEST_SESSION_ID, syncRun)).resolves.toBeUndefined();
      expect(await models.LocalSystemFact.get(FACT_LAST_SUCCESSFUL_SYNC_PULL)).toBe('20');
    });
  });
});
