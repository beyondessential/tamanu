/* eslint-disable global-require */
import { inspect } from 'util';
import config from 'config';

import { sleepAsync } from 'shared/utils/sleepAsync';
import { fake } from 'shared/test-helpers/fake';
import { createDummyPatient } from 'shared/demoData/patients';
import { withErrorShown } from '@tamanu/shared/test-helpers';
import { FacilitySyncManager } from '../../app/sync/FacilitySyncManager';
import {
  __testOnlyPushOutGoingChangesSpy,
  __testOnlyEnableSpy,
} from '../../app/sync/pushOutgoingChanges';

import { createTestContext } from '../utilities';

describe('FacilitySyncManager', () => {
  let ctx;
  let models;
  let sequelize;
  const TEST_SESSION_ID = 'sync123';

  beforeAll(
    withErrorShown(async () => {
      ctx = await createTestContext();
      models = ctx.models;
      sequelize = ctx.sequelize;
    }),
  );

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
          startSyncSession: () => ({ sessionId: TEST_SESSION_ID, tick: 1 }),
          endSyncSession: jest.fn(),
        },
      });

      jest.spyOn(syncManager, 'pullChanges').mockImplementation(() => true);
      jest.spyOn(syncManager, 'pushChanges').mockImplementation(() => true);

      await syncManager.runSync();

      expect(dropSchema).toBeCalledTimes(1);
      expect(dropSchema).toBeCalledWith('sync_snapshots');
      expect(createSchema).toBeCalledTimes(1);
      expect(createSchema).toBeCalledWith('sync_snapshots', {});
    });
  });

  describe('pushChanges', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it("snapshots outgoing changes with the current 'lastSuccessfulSyncPush'", async () => {
      await ctx.models.LocalSystemFact.set('lastSuccessfulSyncPush', '10');

      jest.doMock('../../app/sync/snapshotOutgoingChanges', () => ({
        snapshotOutgoingChanges: jest.fn().mockImplementation(() => []),
      }));

      // Have to load test function within test scope so that we can mock dependencies per test case
      const {
        FacilitySyncManager: TestFacilitySyncManager,
      } = require('../../app/sync/FacilitySyncManager');
      const { snapshotOutgoingChanges } = require('../../app/sync/snapshotOutgoingChanges');

      const syncManager = new TestFacilitySyncManager({
        models,
        sequelize: ctx.sequelize,
        centralServer: {
          startSyncSession: () => ({ sessionId: TEST_SESSION_ID, tick: 1 }),
          endSyncSession: jest.fn(),
          push: jest.fn(),
        },
      });

      await syncManager.pushChanges(TEST_SESSION_ID, 10);

      expect(snapshotOutgoingChanges).toBeCalledTimes(1);
      expect(snapshotOutgoingChanges).toBeCalledWith(ctx.sequelize, expect.any(Object), '10');
    });

    it('pushes outgoing changes with current sessionId', async () => {
      const outgoingChanges = [{ test: 'test' }];
      await ctx.models.LocalSystemFact.set('currentSyncTick', '10');

      jest.doMock('../../app/sync/snapshotOutgoingChanges', () => ({
        ...jest.requireActual('../../app/sync/snapshotOutgoingChanges'),
        snapshotOutgoingChanges: jest.fn().mockImplementation(() => outgoingChanges),
      }));
      jest.doMock('../../app/sync/pushOutgoingChanges', () => ({
        ...jest.requireActual('../../app/sync/pushOutgoingChanges'),
        pushOutgoingChanges: jest.fn().mockImplementation(() => true),
      }));

      // Have to load test function within test scope so that we can mock dependencies per test case
      const {
        FacilitySyncManager: TestFacilitySyncManager,
      } = require('../../app/sync/FacilitySyncManager');
      const { pushOutgoingChanges } = require('../../app/sync/pushOutgoingChanges');

      const syncManager = new TestFacilitySyncManager({
        models,
        sequelize: ctx.sequelize,
        centralServer: {
          startSyncSession: () => ({ sessionId: TEST_SESSION_ID, tick: 1 }),
          endSyncSession: jest.fn(),
          push: jest.fn(),
        },
      });

      await syncManager.pushChanges(TEST_SESSION_ID, 1);

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
      jest.resetModules();
    });

    it("pull changes with current 'lastSuccessfulSyncPull'", async () => {
      await ctx.models.LocalSystemFact.set('lastSuccessfulSyncPull', '10');

      jest.doMock('shared/sync', () => ({
        ...jest.requireActual('shared/sync'),
        createSnapshotTable: jest.fn(),
      }));
      jest.doMock('../../app/sync/pullIncomingChanges', () => ({
        ...jest.requireActual('../../app/sync/pullIncomingChanges'),
        pullIncomingChanges: jest.fn().mockImplementation(() => []),
      }));

      // Have to load test function within test scope so that we can mock dependencies per test case
      const {
        FacilitySyncManager: TestFacilitySyncManager,
      } = require('../../app/sync/FacilitySyncManager');
      const { createSnapshotTable } = require('shared/sync');

      const syncManager = new TestFacilitySyncManager({
        models,
        sequelize: ctx.sequelize,
        centralServer: {
          startSyncSession: () => ({ sessionId: TEST_SESSION_ID, tick: 1 }),
          endSyncSession: jest.fn(),
          push: jest.fn(),
        },
      });

      await syncManager.pullChanges(TEST_SESSION_ID);

      expect(createSnapshotTable).toBeCalledTimes(1);
      expect(createSnapshotTable).toBeCalledWith(ctx.sequelize, TEST_SESSION_ID);
    });

    it('save changes with current sessionId', async () => {
      await ctx.models.LocalSystemFact.set('currentSyncTick', '10');

      jest.doMock('shared/sync', () => ({
        ...jest.requireActual('shared/sync'),
        createSnapshotTable: jest.fn(),
        saveIncomingChanges: jest.fn(),
      }));
      jest.doMock('../../app/sync/pullIncomingChanges', () => ({
        ...jest.requireActual('../../app/sync/pullIncomingChanges'),
        pullIncomingChanges: jest.fn().mockImplementation(() => ({ totalPulled: 3, tick: 1 })),
      }));

      // Have to load test function within test scope so that we can mock dependencies per test case
      const {
        FacilitySyncManager: TestFacilitySyncManager,
      } = require('../../app/sync/FacilitySyncManager');
      const { saveIncomingChanges } = require('shared/sync');

      const syncManager = new TestFacilitySyncManager({
        models,
        sequelize: ctx.sequelize,
        centralServer: {
          startSyncSession: () => ({ sessionId: TEST_SESSION_ID, tick: 1 }),
          endSyncSession: jest.fn(),
          push: jest.fn(),
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

  describe('edge cases', () => {
    beforeAll(async () => {
      __testOnlyEnableSpy();
    });

    it('will not start snapshotting until all transactions started under the old sync tick have committed', async () => {
      // It is possible for a transaction to be in flight when a sync starts, having created or
      // updated at least one record within it, but not yet committed/rolled back. If the sync
      // session starts at this moment, and progresses through to begin snapshotting before the
      // transaction completes, that create or update will have been recorded with the old sync
      // tick, but will not be included in the snapshot.

      const currentSyncTick = '6';
      const newSyncTick = '8';

      const {
        FacilitySyncManager: TestFacilitySyncManager,
      } = require('../../app/sync/FacilitySyncManager');
      const syncManager = new TestFacilitySyncManager({
        models,
        sequelize,
        centralServer: {
          startSyncSession: jest.fn().mockImplementation(async () => ({
            sessionId: TEST_SESSION_ID,
            startedAtTick: newSyncTick,
          })),
          push: jest.fn(),
          completePush: jest.fn(),
          endSyncSession: jest.fn(),
          initiatePull: jest.fn().mockImplementation(async () => ({
            totalToPull: 0,
            pullUntil: 0,
          })),
        },
      });

      // set current sync tick
      await models.LocalSystemFact.set('currentSyncTick', currentSyncTick);
      await ctx.models.LocalSystemFact.set('lastSuccessfulSyncPush', '2');

      // create a record that will be committed before the sync starts, so safely gets the current
      // sync tick and available in the db for snapshotting
      await models.Facility.findOrCreate({
        where: { id: config.serverFacilityId },
        defaults: {
          ...fake(models.Facility),
          id: config.serverFacilityId,
        },
      });
      const { id: safePatientId } = await models.Patient.create(createDummyPatient());

      // start a transaction that will not commit until after the sync starts
      // create another record within a transaction, which will get the current sync tick but not be
      // committed to the db yet
      const transaction = await sequelize.transaction();
      const { id: riskyPatientId } = await models.Patient.create(createDummyPatient(), {
        transaction,
      });

      // start the sync
      const syncPromise = syncManager.runSync();

      // after a wait for sync to move through to snapshotting, commit the transaction and await
      // the rest of the sync
      await sleepAsync(200);
      await transaction.commit();
      await syncPromise;

      // check that the sync tick has been updated
      const updatedSyncTick = await models.LocalSystemFact.get('currentSyncTick');
      expect(updatedSyncTick).toBe(newSyncTick);

      // check that both patient records have the old sync tick
      const safePatient = await models.Patient.findByPk(safePatientId);
      expect(safePatient.updatedAtSyncTick).toBe(currentSyncTick);
      const riskyPatient = await models.Patient.findByPk(riskyPatientId);
      expect(riskyPatient.updatedAtSyncTick).toBe(currentSyncTick);

      // check that the snapshot included _both_ patient records (the changes get passed as an
      // argument to pushOutgoingChanges, which we spy on)
      expect(
        __testOnlyPushOutGoingChangesSpy[0].changes
          .filter(c => c.recordType === 'patients')
          .map(c => c.recordId)
          .sort(),
      ).toStrictEqual([safePatientId, riskyPatientId].sort());
    });
  });
});
