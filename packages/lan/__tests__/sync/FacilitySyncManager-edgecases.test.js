/* eslint-disable global-require */
import config from 'config';

import { sleepAsync } from '@tamanu/shared/utils/sleepAsync';
import { fake, fakeUser } from '@tamanu/shared/test-helpers/fake';
import { createDummyEncounter, createDummyPatient } from 'shared/demoData/patients';
import { createTestContext } from '../utilities';
// import { pushOutgoingChanges } from '../../app/sync/pushOutgoingChanges';

describe('FacilitySyncManager edge cases', () => {
  let ctx;
  let models;
  let sequelize;
  const TEST_SESSION_ID = 'sync123';
  const LAST_SUCCESSFUL_SYNC_PUSH = '2';

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
    syncManager.__testSpyEnabled = true;

    // set current sync tick
    await models.LocalSystemFact.set('currentSyncTick', currentSyncTick);
    await ctx.models.LocalSystemFact.set('lastSuccessfulSyncPush', LAST_SUCCESSFUL_SYNC_PUSH);

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
      syncManager.__testOnlyPushChangesSpy[0].outgoingChanges
        .filter(c => c.recordType === 'patients')
        .map(c => c.recordId)
        .sort(),
    ).toStrictEqual([safePatientId, riskyPatientId].sort());
  });

  it('will throw an error if there is update between push and pull', async () => {
    const ENCOUNTER_ID = '8b672978-2207-41fc-9da0-6de8b21a47a9';

    const currentSyncTick = '6';
    const newSyncTick = '8';

    // set current sync tick
    await models.LocalSystemFact.set('currentSyncTick', currentSyncTick);
    await models.LocalSystemFact.set('lastSuccessfulSyncPush', LAST_SUCCESSFUL_SYNC_PUSH);
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
    const patient = await models.Patient.create({
      ...fake(models.Patient),
    });
    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      id: ENCOUNTER_ID,
      patientId: patient.id,
    });

    let resolvePushOutgoingChangesPromise;
    const pushOutgoingChangesPromise = new Promise(resolve => {
      resolvePushOutgoingChangesPromise = () => resolve(true);
    });
    jest.doMock('../../app/sync/pushOutgoingChanges', () => ({
      ...jest.requireActual('../../app/sync/pushOutgoingChanges'),
      pushOutgoingChanges: jest.fn().mockImplementation(() => {
        return pushOutgoingChangesPromise;
      }),
    }));

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
        pull: jest.fn().mockImplementation(async () => [
          {
            id: ENCOUNTER_ID,
            recordId: ENCOUNTER_ID,
            isDeleted: false,
            recordType: models.Encounter.tableName,
            savedAtSyncTick: 1,
            data: {
              id: ENCOUNTER_ID,
              ...encounter.dataValues,
            },
          },
        ]),
        completePush: jest.fn(),
        endSyncSession: jest.fn(),
        initiatePull: jest.fn().mockImplementation(async () => ({
          totalToPull: 1,
          pullUntil: 1,
        })),
      },
    });
    syncManager.__testSpyEnabled = true;

    // start the sync
    const syncPromise = syncManager.runSync();

    await sleepAsync(200);

    // Update encounter after snapshotting for push has finished
    encounter.reasonForEncounter = 'Updated';
    await encounter.save();

    try {
      // Release pushOutgoingChanges promise and proceed the validation
      resolvePushOutgoingChangesPromise();
      await syncPromise;
    } catch (e) {
      expect(e.message).toEqual(
        'Facility: There are encounters records updated in between pull and push',
      );
    }
  });
});
