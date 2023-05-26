import { inspect } from 'util';
import { sleepAsync } from 'shared/utils/sleepAsync';
import { fake } from 'shared/test-helpers/fake';
import config from 'config';

import { createDummyPatient } from 'shared/demoData/patients';
import { FacilitySyncManager } from '../../app/sync/FacilitySyncManager';
import { __testOnlyPushOutGoingChangesSpy, __testOnlyEnableSpy } from '../../app/sync/pushOutgoingChanges';

import { createTestContext } from '../utilities';

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

  describe('edge cases', () => {
    let ctx;
    let models;
    let sequelize;

    beforeAll(async () => {
      ctx = await createTestContext();
      models = ctx.models;
      sequelize = ctx.sequelize;
      __testOnlyEnableSpy();
    });
    afterAll(() => ctx.close());

    it('will not start snapshotting until all transactions started under the old sync tick have committed', async () => {
      // It is possible for a transaction to be in flight when a sync starts, having created or
      // updated at least one record within it, but not yet committed/rolled back. If the sync
      // session starts at this moment, and progresses through to begin snapshotting before the
      // transaction completes, that create or update will have been recorded with the old sync
      // tick, but will not be included in the snapshot.

      const currentSyncTick = '6';
      const newSyncTick = '8';
      const syncManager = new FacilitySyncManager({
        models,
        sequelize,
        centralServer: {
          startSyncSession: jest
            .fn()
            .mockImplementation(async () => ({ sessionId: 'x', startedAtTick: newSyncTick })),
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
