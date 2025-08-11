import { FACT_CURRENT_SYNC_TICK, FACT_LOOKUP_UP_TO_TICK } from '@tamanu/constants/facts';
import { SYSTEM_USER_UUID } from '@tamanu/constants';

import { createTestContext, waitForSession } from '../utilities';

describe('endSession', () => {
  let ctx;
  let models;

  const DEFAULT_CURRENT_SYNC_TIME_VALUE = 2;
  const DEFAULT_CONFIG = {
    sync: {
      lookupTable: {
        enabled: false,
      },
      maxRecordsPerSnapshotChunk: 1000000000,
    },
  };

  const initializeCentralSyncManager = config => {
    // Have to load test function within test scope so that we can mock dependencies per test case
    const {
      CentralSyncManager: TestCentralSyncManager,
    } = require('../../dist/sync/CentralSyncManager');

    TestCentralSyncManager.overrideConfig(config || DEFAULT_CONFIG);

    return new TestCentralSyncManager(ctx);
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models } = ctx.store);
  });

  beforeEach(async () => {
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, DEFAULT_CURRENT_SYNC_TIME_VALUE);
    await models.SyncLookupTick.truncate({ force: true });
    await models.SyncDeviceTick.truncate({ force: true });
    await models.Facility.truncate({ cascade: true, force: true });
    await models.ReferenceData.truncate({ cascade: true, force: true });
    await models.User.truncate({ cascade: true, force: true });
    await models.User.create({
      id: SYSTEM_USER_UUID,
      email: 'system',
      displayName: 'System',
      role: 'system',
    });
    await models.Setting.set('audit.changes.enabled', false);
    await models.LocalSystemFact.set(FACT_LOOKUP_UP_TO_TICK, null);
    await models.SyncLookup.truncate({ force: true });
    await models.DebugLog.truncate({ force: true });
  });

  afterAll(() => ctx.close());

  it('set completedAt when ending an existing session', async () => {
    const centralSyncManager = initializeCentralSyncManager();
    const { sessionId } = await centralSyncManager.startSession();
    await waitForSession(centralSyncManager, sessionId);

    await centralSyncManager.endSession(sessionId);
    const syncSession2 = await models.SyncSession.findOne({ where: { id: sessionId } });
    expect(syncSession2.completedAt).not.toBeUndefined();
  });

  it('throws an error when connecting to a session that already ended', async () => {
    const centralSyncManager = initializeCentralSyncManager();
    const { sessionId } = await centralSyncManager.startSession();
    await waitForSession(centralSyncManager, sessionId);

    await centralSyncManager.endSession(sessionId);
    await expect(centralSyncManager.connectToSession(sessionId)).rejects.toThrow();
  });
});
