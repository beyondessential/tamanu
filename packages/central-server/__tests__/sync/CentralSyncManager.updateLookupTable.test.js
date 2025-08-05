import { Op } from 'sequelize';
import { FACT_CURRENT_SYNC_TICK, FACT_LOOKUP_UP_TO_TICK } from '@tamanu/constants/facts';
import { SYNC_SESSION_DIRECTION } from '@tamanu/database/sync';
import { fake } from '@tamanu/fake-data/fake';
import { sleepAsync } from '@tamanu/utils/sleepAsync';
import { DEBUG_LOG_TYPES, SYSTEM_USER_UUID } from '@tamanu/constants';
import { createTestContext } from '../utilities';
import {
  initializeCentralSyncManager,
  waitForSession,
  prepareRecordsForSync,
  prepareMockedPullOnlyModelQueryPromise,
  doImport,
  DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
} from './CentralSyncManager.utils';

describe('CentralSyncManager.updateLookupTable', () => {
  let ctx;
  let models;

  beforeEach(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });

  afterEach(async () => {
    // Revert to the original models
    ctx.store.models = models;
    await ctx.cleanup();
  });

  beforeEach(async () => {
    jest.resetModules();
  });

  it('inserts records into sync lookup table', async () => {
    const patient1 = await models.Patient.create(fake(models.Patient));

    const centralSyncManager = initializeCentralSyncManager(ctx, {
      sync: {
        lookupTable: {
          enabled: true,
        },
        maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
      },
    });

    await centralSyncManager.updateLookupTable();

    const lookupData = await models.SyncLookup.findAll({
      where: {
        recordId: {
          [Op.not]: SYSTEM_USER_UUID,
        },
      },
    });

    expect(lookupData).toHaveLength(1);
    expect(lookupData[0]).toEqual(
      expect.objectContaining({
        recordId: patient1.id,
        recordType: 'patients',
        data: expect.objectContaining({
          id: patient1.id,
          displayId: patient1.displayId,
          firstName: patient1.firstName,
          middleName: patient1.middleName,
          lastName: patient1.lastName,
          culturalName: patient1.culturalName,
          dateOfBirth: patient1.dateOfBirth,
          dateOfDeath: null,
          sex: patient1.sex,
          email: patient1.email,
          visibilityStatus: patient1.visibilityStatus,
          villageId: null,
          mergedIntoId: null,
        }),
        isLabRequest: false,
        isDeleted: false,
      }),
    );
  });

  it('updates new changes from records into sync lookup table', async () => {
    const patient1 = await models.Patient.create(fake(models.Patient));

    const centralSyncManager = initializeCentralSyncManager(ctx, {
      sync: {
        lookupTable: {
          enabled: true,
        },
        maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
      },
    });

    const currentSyncTime = await models.LocalSystemFact.get(FACT_CURRENT_SYNC_TICK);

    await centralSyncManager.updateLookupTable();

    const lookupData = await models.SyncLookup.findAll({
      where: {
        recordId: {
          [Op.not]: SYSTEM_USER_UUID,
        },
      },
    });

    expect(lookupData).toHaveLength(1);
    expect(lookupData[0]).toEqual(
      expect.objectContaining({
        recordId: patient1.id,
        recordType: 'patients',
        data: expect.objectContaining({
          id: patient1.id,
          displayId: patient1.displayId,
          firstName: patient1.firstName,
          middleName: patient1.middleName,
          lastName: patient1.lastName,
          culturalName: patient1.culturalName,
          dateOfBirth: patient1.dateOfBirth,
          dateOfDeath: null,
          sex: patient1.sex,
          email: patient1.email,
          visibilityStatus: patient1.visibilityStatus,
          villageId: null,
          mergedIntoId: null,
        }),
        isLabRequest: false,
        isDeleted: false,
        updatedAtSyncTick: currentSyncTime,
      }),
    );

    patient1.firstName = 'New First Name';
    await patient1.save();

    await centralSyncManager.updateLookupTable();
    const lookupData2 = await models.SyncLookup.findAll({
      where: {
        recordId: {
          [Op.not]: SYSTEM_USER_UUID,
        },
      },
    });

    const newCurrentSyncTime = (await models.LocalSystemFact.get(FACT_CURRENT_SYNC_TICK)) - 1;

    expect(lookupData2).toHaveLength(1);
    expect(lookupData2[0]).toEqual(
      expect.objectContaining({
        recordId: patient1.id,
        recordType: 'patients',
        data: expect.objectContaining({
          id: patient1.id,
          displayId: patient1.displayId,
          firstName: 'New First Name',
          middleName: patient1.middleName,
          lastName: patient1.lastName,
          culturalName: patient1.culturalName,
          dateOfBirth: patient1.dateOfBirth,
          dateOfDeath: null,
          sex: patient1.sex,
          email: patient1.email,
          visibilityStatus: patient1.visibilityStatus,
          villageId: null,
          mergedIntoId: null,
        }),
        isLabRequest: false,
        isDeleted: false,
        updatedAtSyncTick: newCurrentSyncTime.toString(), // we take the tick for this
      }),
    );
  });

  it('allows having the same recordId but different record_type in sync lookup table', async () => {
    const patient1 = await models.Patient.create(fake(models.Patient));
    await models.ReferenceData.create(
      fake(models.ReferenceData, { id: patient1.id }), // use the same id between patient and reference_data
    );

    const centralSyncManager = initializeCentralSyncManager(ctx, {
      sync: {
        lookupTable: {
          enabled: true,
        },
        maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
      },
    });

    const currentSyncTime = await models.LocalSystemFact.get(FACT_CURRENT_SYNC_TICK);

    await centralSyncManager.updateLookupTable();

    const lookupData = await models.SyncLookup.findAll({
      where: {
        recordId: {
          [Op.not]: SYSTEM_USER_UUID,
        },
      },
    });

    expect(lookupData).toHaveLength(2);
    expect(lookupData.find(d => d.recordType === 'patients')).toEqual(
      expect.objectContaining({
        recordId: patient1.id,
        recordType: 'patients',
        data: expect.objectContaining({
          id: patient1.id,
          displayId: patient1.displayId,
          firstName: patient1.firstName,
          middleName: patient1.middleName,
          lastName: patient1.lastName,
          culturalName: patient1.culturalName,
          dateOfBirth: patient1.dateOfBirth,
          dateOfDeath: null,
          sex: patient1.sex,
          email: patient1.email,
          visibilityStatus: patient1.visibilityStatus,
          villageId: null,
          mergedIntoId: null,
        }),
        isLabRequest: false,
        isDeleted: false,
        updatedAtSyncTick: currentSyncTime,
      }),
    );

    patient1.firstName = 'New First Name';
    await patient1.save();

    await centralSyncManager.updateLookupTable();
    const lookupData2 = await models.SyncLookup.findAll({
      where: {
        recordId: {
          [Op.not]: SYSTEM_USER_UUID,
        },
      },
    });

    const newCurrentSyncTime = (await models.LocalSystemFact.get(FACT_CURRENT_SYNC_TICK)) - 1;

    expect(lookupData2).toHaveLength(2);
    expect(lookupData2.find(d => d.recordType === 'patients')).toEqual(
      expect.objectContaining({
        recordId: patient1.id,
        recordType: 'patients',
        data: expect.objectContaining({
          id: patient1.id,
          displayId: patient1.displayId,
          firstName: 'New First Name',
          middleName: patient1.middleName,
          lastName: patient1.lastName,
          culturalName: patient1.culturalName,
          dateOfBirth: patient1.dateOfBirth,
          dateOfDeath: null,
          sex: patient1.sex,
          email: patient1.email,
          visibilityStatus: patient1.visibilityStatus,
          villageId: null,
          mergedIntoId: null,
        }),
        isLabRequest: false,
        isDeleted: false,
        updatedAtSyncTick: newCurrentSyncTime.toString(),
      }),
    );
  });

  it('does not include records inserted when updating lookup table already started', async () => {
    const records = await prepareRecordsForSync(models);
    const program = records[1];

    // Build the fakeModelPromise so that it can block the updateLookupTable process,
    // then we can insert some new records while updateLookupTable is happening
    const { resolveMockedQueryPromise, modelQueryWaitingPromise, MockedPullOnlyModel } =
      await prepareMockedPullOnlyModelQueryPromise();

    ctx.store.models = {
      MockedPullOnlyModel,
      ...models,
    };

    const centralSyncManager = initializeCentralSyncManager(ctx, {
      sync: {
        lookupTable: {
          enabled: true,
        },
        maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
      },
    });

    // Start the update lookup table process
    const updateLookupTablePromise = centralSyncManager.updateLookupTable();

    // wait until updateLookupTable() reaches the point of querying for MockedModel
    // and block the process inside the wrapper transaction,
    await modelQueryWaitingPromise;

    // Insert the records just before we release the lock,
    // meaning that we're inserting the records below in the middle of the updateLookupTable process,
    // and they SHOULD NOT be included sync_lookup
    const survey2 = await models.Survey.create({
      id: 'test-survey-2',
      programId: program.id,
    });
    const dataElement = await models.ProgramDataElement.create({
      name: 'Profile picture',
      defaultText: 'abcd',
      code: 'ProfilePhoto',
      type: 'Photo',
    });
    await models.SurveyScreenComponent.create({
      dataElementId: dataElement.id,
      surveyId: survey2.id,
      componentIndex: 0,
      text: 'Photo',
      screenIndex: 0,
    });

    // Now release the lock to see if the lookup table captures the newly inserted records above
    await resolveMockedQueryPromise();
    await sleepAsync(20);

    await updateLookupTablePromise;

    const lookupData = await models.SyncLookup.findAll({
      where: {
        recordId: {
          [Op.not]: SYSTEM_USER_UUID,
        },
      },
    });

    // only expect 3 records as it should not include the 3 records inserted manually
    expect(lookupData).toHaveLength(3);
  });

  it('does not include records inserted from importer when updating lookup table already started', async () => {
    await prepareRecordsForSync(models);

    // Build the fakeModelPromise so that it can block the updateLookupTable process,
    // then we can insert some new records while updateLookupTable is happening
    const { resolveMockedQueryPromise, modelQueryWaitingPromise, MockedPullOnlyModel } =
      await prepareMockedPullOnlyModelQueryPromise();

    ctx.store.models = {
      MockedPullOnlyModel,
      ...models,
    };

    const centralSyncManager = initializeCentralSyncManager(ctx, {
      sync: {
        lookupTable: {
          enabled: true,
        },
        maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
      },
    });

    // Start the update lookup table process
    const updateLookupTablePromise = centralSyncManager.updateLookupTable();

    // wait until updateLookupTable() reaches the point of querying for MockedModel
    // and block the process inside the wrapper transaction,
    await modelQueryWaitingPromise;

    // Insert the records just before we release the lock,
    // meaning that we're inserting the records below in the middle of the updateLookupTable process.
    // and they SHOULD NOT be included sync_lookup,
    await doImport({ file: 'refdata-valid', dryRun: false }, models);

    // Now release the lock to see if the lookup table captures the newly inserted records above
    await resolveMockedQueryPromise();
    await sleepAsync(20);

    await updateLookupTablePromise;

    const lookupData = await models.SyncLookup.findAll({
      where: {
        recordId: {
          [Op.not]: SYSTEM_USER_UUID,
        },
      },
    });

    // only expect 3 records as it should not include the 3 records inserted from the importer
    expect(lookupData).toHaveLength(3);
  });

  it('does not include records inserted from another sync session when updating lookup table already started', async () => {
    await prepareRecordsForSync(models);

    // Build the fakeModelPromise so that it can block the updateLookupTable process,
    // then we can insert some new records while updateLookupTable is happening
    const { resolveMockedQueryPromise, modelQueryWaitingPromise, MockedPullOnlyModel } =
      await prepareMockedPullOnlyModelQueryPromise();

    ctx.store.models = {
      MockedPullOnlyModel,
      ...models,
    };

    const centralSyncManager = initializeCentralSyncManager(ctx);

    // Start the update lookup table process
    const updateLookupTablePromise = centralSyncManager.updateLookupTable();

    // wait until updateLookupTable() reaches the point of querying for MockedModel
    // and block the process inside the wrapper transaction,
    await modelQueryWaitingPromise;

    const patient1 = await models.Patient.create({
      ...fake(models.Patient),
    });
    const patient2 = await models.Patient.create({
      ...fake(models.Patient),
    });
    const patient3 = await models.Patient.create({
      ...fake(models.Patient),
    });

    const changes = [
      {
        direction: SYNC_SESSION_DIRECTION.OUTGOING,
        isDeleted: false,
        recordType: 'patients',
        recordId: patient1.id,
        data: patient1,
      },
      {
        direction: SYNC_SESSION_DIRECTION.OUTGOING,
        isDeleted: false,
        recordType: 'patients',
        recordId: patient2.id,
        data: patient2,
      },
      {
        direction: SYNC_SESSION_DIRECTION.OUTGOING,
        isDeleted: false,
        recordType: 'patients',
        recordId: patient3.id,
        data: patient3,
      },
    ];

    const { sessionId: sessionIdTwo } = await centralSyncManager.startSession();
    await waitForSession(centralSyncManager, sessionIdTwo);

    await centralSyncManager.addIncomingChanges(sessionIdTwo, changes);
    await centralSyncManager.completePush(sessionIdTwo);

    // Now release the lock to see if the lookup table captures the newly inserted records above
    await resolveMockedQueryPromise();
    await sleepAsync(20);

    await updateLookupTablePromise;

    const lookupData = await models.SyncLookup.findAll({
      where: {
        recordId: {
          [Op.not]: SYSTEM_USER_UUID,
        },
      },
    });
    // only expect 3 records as it should not include the 3 records inserted from another sync session
    expect(lookupData).toHaveLength(3);
  });

  it('records info about updating sync_lookup in debug log', async () => {
    await models.Patient.create(fake(models.Patient));

    await models.LocalSystemFact.set(FACT_LOOKUP_UP_TO_TICK, 6);

    const centralSyncManager = initializeCentralSyncManager(ctx, {
      sync: {
        lookupTable: {
          enabled: true,
        },
        maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
      },
    });

    await centralSyncManager.updateLookupTable();

    const debugLogs = await models.DebugLog.findAll({});
    expect(debugLogs).toHaveLength(1);
    expect(debugLogs[0]).toMatchObject({
      id: expect.anything(),
      type: DEBUG_LOG_TYPES.SYNC_LOOKUP_UPDATE,
      info: {
        since: '6',
        changesCount: 0,
        startedAt: expect.anything(),
        completedAt: expect.anything(),
      },
    });
  });

  it('records error thrown when updating sync_lookup in debug log', async () => {
    const centralSyncManager = initializeCentralSyncManager(ctx, {
      sync: {
        lookupTable: {
          enabled: true,
        },
        maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
      },
    });

    centralSyncManager.tickTockGlobalClock = jest.fn().mockImplementation(() => {
      throw new Error('Test error');
    });

    try {
      await centralSyncManager.updateLookupTable();
    } catch (e) {
      //swallow error
    }

    const debugLogs = await models.DebugLog.findAll({});
    expect(debugLogs).toHaveLength(1);
    expect(debugLogs[0]).toMatchObject({
      id: expect.anything(),
      type: DEBUG_LOG_TYPES.SYNC_LOOKUP_UPDATE,
      info: {
        error: 'Test error',
        startedAt: expect.anything(),
        completedAt: expect.anything(),
      },
    });
  });
});
