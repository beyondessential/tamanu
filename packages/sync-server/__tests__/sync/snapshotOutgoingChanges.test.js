import { expect, beforeAll, describe, it } from '@jest/globals';
import { Transaction } from 'sequelize';

import { fakeReferenceData, withErrorShown } from 'shared/test-helpers';
import { getModelsForDirection, COLUMNS_EXCLUDED_FROM_SYNC } from 'shared/sync';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { sleepAsync } from 'shared/utils/sleepAsync';
import { fakeUUID } from 'shared/utils/generateId';

import { createTestContext } from '../utilities';
import { snapshotOutgoingChanges } from '../../app/sync/snapshotOutgoingChanges';

const readOnlyConfig = readOnly => ({ sync: { readOnly } });

describe('snapshotOutgoingChanges', () => {
  let ctx;
  let models;
  let outgoingModels;
  const simplestSessionConfig = {
    syncAllLabRequests: false,
    syncAllEncountersForTheseVaccines: [],
    isMobile: false,
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    outgoingModels = getModelsForDirection(models, SYNC_DIRECTIONS.PULL_FROM_CENTRAL);
  });

  afterAll(() => ctx.close());

  it(
    'if in readOnly mode returns 0',
    withErrorShown(async () => {
      const { SyncSession, LocalSystemFact, ReferenceData } = models;
      const startTime = new Date();
      const syncSession = await SyncSession.create({
        startTime,
        lastConnectionTime: startTime,
      });
      await ReferenceData.create(fakeReferenceData());
      const tock = await LocalSystemFact.increment('currentSyncTime', 2);

      const result = await snapshotOutgoingChanges.overrideConfig(
        outgoingModels,
        tock - 1,
        [],
        syncSession.id,
        '',
        simplestSessionConfig,
        readOnlyConfig(true),
      );

      expect(result).toEqual(0);
    }),
  );

  it(
    'if nothing changed returns 0',
    withErrorShown(async () => {
      const { LocalSystemFact } = models;
      const tock = await LocalSystemFact.increment('currentSyncTime', 2);

      const result = await snapshotOutgoingChanges(
        outgoingModels,
        tock - 1,
        [],
        fakeUUID(),
        '',
        simplestSessionConfig,
      );
      expect(result).toEqual(0);
    }),
  );

  it(
    'returns serialised records (excluding metadata columns)',
    withErrorShown(async () => {
      const { SyncSession, SyncSessionRecord, LocalSystemFact, ReferenceData } = models;
      const startTime = new Date();
      const syncSession = await SyncSession.create({
        startTime,
        lastConnectionTime: startTime,
      });
      const tock = await LocalSystemFact.increment('currentSyncTime', 2);
      await ReferenceData.create(fakeReferenceData());

      const result = await snapshotOutgoingChanges(
        outgoingModels,
        tock - 1,
        [],
        syncSession.id,
        '',
        simplestSessionConfig,
      );
      expect(result).toEqual(1);

      const [syncRecord] = await SyncSessionRecord.findAll({
        where: { sessionId: syncSession.id },
      });
      expect(
        Object.keys(syncRecord.data).every(key => !COLUMNS_EXCLUDED_FROM_SYNC.includes(key)),
      ).toBe(true);
    }),
  );

  it(
    'returns records changed since given tick only',
    withErrorShown(async () => {
      const { SyncSession, LocalSystemFact, ReferenceData } = models;
      await LocalSystemFact.increment('currentSyncTime', 2);
      await ReferenceData.create(fakeReferenceData());

      const startTime = new Date();
      const syncSession = await SyncSession.create({
        startTime,
        lastConnectionTime: startTime,
      });
      const tock = await LocalSystemFact.increment('currentSyncTime', 2);
      await ReferenceData.create(fakeReferenceData());

      const result = await snapshotOutgoingChanges(
        outgoingModels,
        tock - 1,
        [],
        syncSession.id,
        '',
        simplestSessionConfig,
      );
      expect(result).toEqual(1);
    }),
  );

  it(
    'returns records changed since more than one tick',
    withErrorShown(async () => {
      const { SyncSession, LocalSystemFact, ReferenceData } = models;
      const firstTock = await LocalSystemFact.increment('currentSyncTime', 2);
      await ReferenceData.create(fakeReferenceData());

      const startTime = new Date();
      const syncSession = await SyncSession.create({
        startTime,
        lastConnectionTime: startTime,
      });
      await LocalSystemFact.increment('currentSyncTime', 2);
      await ReferenceData.create(fakeReferenceData());

      const result = await snapshotOutgoingChanges(
        outgoingModels,
        firstTock - 1,
        [],
        syncSession.id,
        '',
        simplestSessionConfig,
      );
      expect(result).toEqual(2);
    }),
  );

  it(
    'concurrent transaction commits AFTER snapshot commits - SEE NOTE 1',
    withErrorShown(async () => {
      const { SyncSession, LocalSystemFact, ReferenceData } = models;

      const queryReturnValue = [undefined, 0];
      let resolveFakeModelQuery;
      const promise = new Promise(resolve => {
        resolveFakeModelQuery = () => resolve(queryReturnValue);
      });
      const fakeModelThatWaitsUntilWeSaySo = {
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        getAttributes() {
          return {
            id: {},
            name: {},
          };
        },
        sequelize: {
          async query() {
            return promise;
          },
        },
      };

      const startTime = new Date();
      const syncSession = await SyncSession.create({
        startTime,
        lastConnectionTime: startTime,
      });
      const tock = await LocalSystemFact.increment('currentSyncTime', 2);
      await ReferenceData.create(fakeReferenceData());

      /*
        NOTE 1: the central server snapshotOutgoingChanges function currently
        does not use a transaction. The transaction occurs in the CentralSyncManager
        and inside of it it calls snapshotOutgoingChanges twice.

        Because of that, it's necessary to wrap it here, to make sure the concurrency
        works as expected. However, be mindful that the actual function does not provide
        said isolation.
      */
      const snapshot = ctx.store.sequelize.transaction(
        { isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ },
        async () => {
          return snapshotOutgoingChanges(
            {
              // the transaction needs to have a select, ANY select, so the database
              // actually takes a snapshot of the db at that point in time. THEN we
              // can pause the transaction, and test the behaviour.
              Facility: models.Facility,
              FakeModel: fakeModelThatWaitsUntilWeSaySo,
              ReferenceData: models.ReferenceData,
            },
            tock - 1,
            [],
            syncSession.id,
            '',
            simplestSessionConfig,
          );
        },
      );

      // wait for snapshot to start and block, and then create a new record
      await sleepAsync(20);
      const after = ctx.store.sequelize.transaction(async transaction => {
        await ReferenceData.create(fakeReferenceData(), {
          transaction,
        });
      });
      await sleepAsync(20);

      // unblock snapshot
      resolveFakeModelQuery();
      const result = await snapshot;

      expect(result).toEqual(1);
      await after;
    }),
  );

  it(
    'concurrent transaction commits BEFORE snapshot commits - SEE NOTE 1',
    withErrorShown(async () => {
      const { SyncSession, LocalSystemFact, ReferenceData } = models;

      const queryReturnValue = [undefined, 0];
      let resolveFakeModelQuery;
      const promise = new Promise(resolve => {
        resolveFakeModelQuery = () => resolve(queryReturnValue);
      });
      const fakeModelThatWaitsUntilWeSaySo = {
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        getAttributes() {
          return {
            id: {},
            name: {},
          };
        },
        sequelize: {
          async query() {
            return promise;
          },
        },
      };

      const startTime = new Date();
      const syncSession = await SyncSession.create({
        startTime,
        lastConnectionTime: startTime,
      });
      const tock = await LocalSystemFact.increment('currentSyncTime', 2);
      await ReferenceData.create(fakeReferenceData());

      /*
        NOTE 1: the central server snapshotOutgoingChanges function currently
        does not use a transaction. The transaction occurs in the CentralSyncManager
        and inside of it it calls snapshotOutgoingChanges twice.

        Because of that, it's necessary to wrap it here, to make sure the concurrency
        works as expected. However, be mindful that the actual function does not provide
        said isolation.
      */
      const snapshot = ctx.store.sequelize.transaction(
        { isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ },
        async () => {
          return snapshotOutgoingChanges(
            {
              Facility: models.Facility,
              FakeModel: fakeModelThatWaitsUntilWeSaySo,
              ReferenceData: models.ReferenceData,
            },
            tock - 1,
            [],
            syncSession.id,
            '',
            simplestSessionConfig,
          );
        },
      );

      // wait for snapshot to start and block, and then create a new record
      await sleepAsync(20);
      const after = ctx.store.sequelize.transaction(async transaction => {
        await ReferenceData.create(fakeReferenceData(), {
          transaction,
        });
      });
      await sleepAsync(20);
      await after;

      // unblock snapshot
      resolveFakeModelQuery();
      const result = await snapshot;

      expect(result).toEqual(1);
    }),
  );
});
