/* eslint-disable global-require */
import config from 'config';

import { sleepAsync } from '@tamanu/utils/sleepAsync';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import {
  FACT_CURRENT_SYNC_TICK,
  FACT_LAST_SUCCESSFUL_SYNC_PULL,
  FACT_LAST_SUCCESSFUL_SYNC_PUSH,
} from '@tamanu/constants/facts';

import { createTestContext } from '../utilities';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

describe('FacilitySyncManager edge cases', () => {
  let ctx;
  let models;
  let sequelize;
  const TEST_SESSION_ID = 'sync123';
  const LAST_SUCCESSFUL_SYNC_PUSH = '2';
  const LAST_SUCCESSFUL_SYNC_PULL = '2';

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    sequelize = ctx.sequelize;
  });

  afterAll(() => ctx.close());

  beforeEach(() => {
    jest.resetModules();
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
    } = require('../../dist/sync/FacilitySyncManager');
    const syncManager = new TestFacilitySyncManager({
      models,
      sequelize,
      centralServer: {
        streaming: () => false,
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
    syncManager.__testSpyEnabled = true;

    // set current sync tick
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, currentSyncTick);
    await ctx.models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PUSH, LAST_SUCCESSFUL_SYNC_PUSH);

    const [facilityId] = selectFacilityIds(config);
    // create a record that will be committed before the sync starts, so safely gets the current
    // sync tick and available in the db for snapshotting
    await models.Facility.findOrCreate({
      where: { id: facilityId },
      defaults: {
        ...fake(models.Facility),
        id: facilityId,
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
    const updatedSyncTick = await models.LocalSystemFact.get(FACT_CURRENT_SYNC_TICK);
    expect(updatedSyncTick).toBe(newSyncTick);

    // check that both patient records have the old sync tick
    const safePatient = await models.Patient.findByPk(safePatientId);
    expect(safePatient.updatedAtSyncTick).toBe(currentSyncTick);
    const riskyPatient = await models.Patient.findByPk(riskyPatientId);
    expect(riskyPatient.updatedAtSyncTick).toBe(currentSyncTick);

    // check that the snapshot included _both_ patient records (the changes get passed as an
    // argument to pushOutgoingChanges, which we spy on)
    expect(
      syncManager.__testOnlyPushChangesSpy[0].outgoingChanges
        .filter(c => c.recordType === 'patients')
        .map(c => c.recordId)
        .sort(),
    ).toStrictEqual([safePatientId, riskyPatientId].sort());
  });

  describe('handles local updates between "snapshot for push" and "pull"', () => {
    let patient;
    let syncManager;

    const CURRENT_SYNC_TICK = '6';
    const NEW_SYNC_TICK = '8';

    const errorsSentToCentral = new Map();

    beforeAll(async () => {
      const facility = await models.Facility.create({
        ...fake(models.Facility),
      });
      await models.User.create(fakeUser());
      await models.Department.create({
        ...fake(models.Department),
        facilityId: facility.id,
      });
      await models.Location.create({
        ...fake(models.Location),
        facilityId: facility.id,
      });
      patient = await models.Patient.create({
        ...fake(models.Patient),
      });
    });

    const initializeSyncManager = async (configToOverride = null) => {
      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
      });
      const {
        FacilitySyncManager: TestFacilitySyncManager,
      } = require('../../dist/sync/FacilitySyncManager');
      if (configToOverride) {
        TestFacilitySyncManager.overrideConfig(configToOverride);
      }
      syncManager = new TestFacilitySyncManager({
        models,
        sequelize,
        centralServer: {
          streaming: () => false,
          startSyncSession: jest.fn().mockImplementation(async () => ({
            sessionId: TEST_SESSION_ID,
            startedAtTick: NEW_SYNC_TICK,
          })),
          push: jest.fn(),
          pull: jest.fn().mockImplementation(async () => [
            {
              id: 1,
              recordId: encounter.id,
              isDeleted: false,
              recordType: models.Encounter.tableName,
              savedAtSyncTick: 1,
              data: {
                ...encounter.dataValues,
              },
            },
          ]),
          markSessionErrored: jest.fn().mockImplementation((sessionId, error) => {
            errorsSentToCentral.set(sessionId, [
              ...(errorsSentToCentral.get(sessionId) || []),
              error,
            ]);
          }),
          completePush: jest.fn(),
          endSyncSession: jest.fn(),
          initiatePull: jest.fn().mockImplementation(async () => ({
            totalToPull: 1,
            pullUntil: 1,
          })),
        },
      });
      syncManager.__testSpyEnabled = true;
      return encounter;
    };

    beforeEach(async () => {
      jest.resetModules();
      errorsSentToCentral.clear(); // Clear previous error messages

      await models.Encounter.truncate({ force: true, cascade: true });
      await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, CURRENT_SYNC_TICK);
      await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PUSH, LAST_SUCCESSFUL_SYNC_PUSH);
      await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PULL, LAST_SUCCESSFUL_SYNC_PULL);
    });

    it('does not throw an error if pulled records was not updated between push and pull', async () => {
      let resolvePushOutgoingChangesPromise;
      const pushOutgoingChangesPromise = new Promise(resolve => {
        resolvePushOutgoingChangesPromise = async () => resolve(true);
      });
      jest.doMock('../../dist/sync/pushOutgoingChanges', () => ({
        ...jest.requireActual('../../dist/sync/pushOutgoingChanges'),
        pushOutgoingChanges: jest.fn().mockImplementation(() => {
          return pushOutgoingChangesPromise;
        }),
      }));

      await initializeSyncManager();

      // start the sync
      const syncPromise = syncManager.runSync();

      await sleepAsync(200);

      // Update patient which is not one of the pulled records
      patient.lastName = 'Updated';
      await patient.save();

      await resolvePushOutgoingChangesPromise();

      // No expects as if there is an error, it should fail the test
      await syncPromise;
    });

    it('throws an error if a pulled record was updated between push and pull', async () => {
      let resolvePushOutgoingChangesPromise;
      const pushOutgoingChangesPromise = new Promise(resolve => {
        resolvePushOutgoingChangesPromise = async () => resolve(true);
      });
      jest.doMock('../../dist/sync/pushOutgoingChanges', () => ({
        ...jest.requireActual('../../dist/sync/pushOutgoingChanges'),
        pushOutgoingChanges: jest.fn().mockImplementation(() => {
          return pushOutgoingChangesPromise;
        }),
      }));

      const configToOverride = {
        sync: { enabled: true, assertIfPulledRecordsUpdatedAfterPushSnapshot: true },
      };
      const encounter = await initializeSyncManager(configToOverride);

      // start the sync
      const syncPromise = syncManager.runSync();

      await sleepAsync(200);

      // Update encounter which is one of the pulled records
      encounter.reasonForEncounter = 'Updated';
      await encounter.save();

      await resolvePushOutgoingChangesPromise();

      const expectedError =
        "Facility: There are 1 encounters record(s) updated between 'snapshot-for-pushing' and now. Error thrown to restart the sync cycle and push the updated records to central";
      await expect(async () => {
        await syncPromise;
      }).rejects.toThrow(expectedError);

      // check that the error was sent to central
      expect(errorsSentToCentral.get(TEST_SESSION_ID)).toEqual([expectedError]);
    });

    it('does not throw an error if a pulled record was updated between push and pull, but the config was disabled', async () => {
      let resolvePushOutgoingChangesPromise;
      const pushOutgoingChangesPromise = new Promise(resolve => {
        resolvePushOutgoingChangesPromise = async () => resolve(true);
      });
      jest.doMock('../../dist/sync/pushOutgoingChanges', () => ({
        ...jest.requireActual('../../dist/sync/pushOutgoingChanges'),
        pushOutgoingChanges: jest.fn().mockImplementation(() => {
          return pushOutgoingChangesPromise;
        }),
      }));

      const configToOverride = {
        sync: { enabled: false, assertIfPulledRecordsUpdatedAfterPushSnapshot: false },
      };
      const encounter = await initializeSyncManager(configToOverride);

      // start the sync
      const syncPromise = syncManager.runSync();

      await sleepAsync(200);

      // Update encounter which is one of the pulled records
      encounter.reasonForEncounter = 'Updated';
      await encounter.save();

      await resolvePushOutgoingChangesPromise();

      // No expects as if there is an error, it should fail the test
      await syncPromise;
    });
  });
});
