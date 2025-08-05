import { fake } from '@tamanu/fake-data/fake';
import { sleepAsync } from '@tamanu/utils/sleepAsync';
import { importerTransaction } from '../../dist/admin/importer/importerEndpoint';
import { referenceDataImporter } from '../../dist/admin/referenceDataImporter';

const doImport = (options, models) => {
  const { file, ...opts } = options;
  return importerTransaction({
    referenceDataImporter,
    file: `./__tests__/sync/testData/${file}.xlsx`,
    models,
    ...opts,
  });
};

const DEFAULT_CURRENT_SYNC_TIME_VALUE = 2;
const DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS = 100000000;
const DEFAULT_CONFIG = {
  sync: {
    lookupTable: {
      enabled: false,
    },
    maxRecordsPerSnapshotChunk: 1000000000,
  },
};

const initializeCentralSyncManager = (ctx, config) => {
  // Have to load test function within test scope so that we can mock dependencies per test case
  const {
    CentralSyncManager: TestCentralSyncManager,
  } = require('../../dist/sync/CentralSyncManager');

  TestCentralSyncManager.overrideConfig(config || DEFAULT_CONFIG);

  return new TestCentralSyncManager(ctx);
};

const waitForSession = async (centralSyncManager, sessionId) => {
  let ready = false;
  while (!ready) {
    ready = await centralSyncManager.checkSessionReady(sessionId);
    await sleepAsync(100);
  }
};

const waitForPushCompleted = async (centralSyncManager, sessionId) => {
  let complete = false;
  while (!complete) {
    complete = await centralSyncManager.checkPushComplete(sessionId);
    await sleepAsync(100);
  }
};

const expectMatchingSessionData = (sessionData1, sessionData2) => {
  const cleanedSessionData1 = { ...sessionData1 };
  const cleanedSessionData2 = { ...sessionData2 };

  // Remove updatedAt and lastConnectionTime as these fields change on every connect, so they return false negatives when comparing session data
  delete cleanedSessionData1.updatedAt;
  delete cleanedSessionData2.updatedAt;
  delete cleanedSessionData1.lastConnectionTime;
  delete cleanedSessionData2.lastConnectionTime;

  expect(cleanedSessionData1).toEqual(cleanedSessionData2);
};

const prepareRecordsForSync = async models => {
  // Pre insert the records below for snapshotting later
  const facility = await models.Facility.create(fake(models.Facility));
  const program = await models.Program.create({
    id: 'test-program-1',
    name: 'Program',
  });
  const survey = await models.Survey.create({
    id: 'test-survey-1',
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
    surveyId: survey.id,
    componentIndex: 0,
    text: 'Photo',
    screenIndex: 0,
  });

  return [facility, program, survey, dataElement];
};

const prepareMockedPullOnlyModelQueryPromise = async () => {
  const MockedPullOnlyModel = {
    tableName: 'mocked_pull_only_model',
    getAttributes() {
      return {
        id: {
          type: 'STRING',
          primaryKey: true,
        },
      };
    },
    async query() {
      // This will be resolved by the test
      return new Promise(resolve => {
        this.resolveQuery = resolve;
      });
    },
  };

  const modelQueryWaitingPromise = new Promise(resolve => {
    MockedPullOnlyModel.resolveQuery = resolve;
  });

  const resolveMockedQueryPromise = () => {
    MockedPullOnlyModel.resolveQuery();
  };

  return {
    MockedPullOnlyModel,
    modelQueryWaitingPromise,
    resolveMockedQueryPromise,
  };
};

const getOutgoingIdsForRecordType = async (centralSyncManager, models, facilityId, recordType) => {
  await centralSyncManager.updateLookupTable();

  const { sessionId } = await centralSyncManager.startSession();
  await waitForSession(centralSyncManager, sessionId);

  await centralSyncManager.setupSnapshotForPull(
    sessionId,
    {
      since: 1,
      facilityIds: [facilityId],
    },
    () => true,
  );

  const outgoingChanges = await centralSyncManager.getOutgoingChanges(sessionId, {});
  return outgoingChanges.filter(c => c.recordType === recordType).map(c => c.recordId);
};

const checkSensitiveRecordFiltering = async (
  centralSyncManager,
  models,
  { model, sensitiveId, nonSensitiveId, nonSensitiveFacilityId },
) => {
  const recordIds = await getOutgoingIdsForRecordType(
    centralSyncManager,
    models,
    nonSensitiveFacilityId,
    model.tableName,
  );

  if (recordIds.length === 0) {
    throw new Error(
      `No records found for record type ${model.tableName} in lookup table, Check the test setup!`,
    );
  }

  expect(recordIds).not.toContain(sensitiveId);
  expect(recordIds).toContain(nonSensitiveId);
};

module.exports = {
  doImport,
  DEFAULT_CURRENT_SYNC_TIME_VALUE,
  DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
  DEFAULT_CONFIG,
  initializeCentralSyncManager,
  waitForSession,
  waitForPushCompleted,
  expectMatchingSessionData,
  prepareRecordsForSync,
  prepareMockedPullOnlyModelQueryPromise,
  getOutgoingIdsForRecordType,
  checkSensitiveRecordFiltering,
};
