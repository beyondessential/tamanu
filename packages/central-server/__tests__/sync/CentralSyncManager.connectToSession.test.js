import { FACT_CURRENT_SYNC_TICK, FACT_LOOKUP_UP_TO_TICK } from '@tamanu/constants/facts';
import { sleepAsync } from '@tamanu/utils/sleepAsync';
import { SYSTEM_USER_UUID } from '@tamanu/constants';

import {
  createTestContext,
  waitForSession,
  initializeCentralSyncManagerWithContext,
} from '../utilities';

describe('CentralSyncManager.connectToSession', () => {
  let ctx;
  let models;

  const DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS = 100000000;
  const initializeCentralSyncManager = config =>
    initializeCentralSyncManagerWithContext(ctx, config);

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models } = ctx.store);
  });

  beforeEach(async () => {
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, 2);
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

  it('allows connecting to an existing session', async () => {
    const centralSyncManager = initializeCentralSyncManager();
    const { sessionId } = await centralSyncManager.startSession();
    await waitForSession(centralSyncManager, sessionId);

    const syncSession = await centralSyncManager.connectToSession(sessionId);
    expect(syncSession).toBeDefined();
  });

  it('throws an error if connecting to a session that has errored out', async () => {
    const centralSyncManager = initializeCentralSyncManager();
    const { sessionId } = await centralSyncManager.startSession();
    await waitForSession(centralSyncManager, sessionId);

    const session = await models.SyncSession.findByPk(sessionId);
    await session.markErrored(
      'Snapshot processing incomplete, likely because the central server restarted during the snapshot',
    );

    await expect(centralSyncManager.connectToSession(sessionId)).rejects.toThrow(
      `Sync session '${sessionId}' encountered an error: Snapshot processing incomplete, likely because the central server restarted during the snapshot`,
    );
  });

  it("does not throw an error when connecting to a session that has not taken longer than configured 'syncSessionTimeoutMs'", async () => {
    const centralSyncManager = initializeCentralSyncManager({
      sync: {
        lookupTable: {
          enabled: false,
        },
        syncSessionTimeoutMs: 1000,
        maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
      },
    });
    const { sessionId } = await centralSyncManager.startSession();
    await waitForSession(centralSyncManager, sessionId);

    await sleepAsync(500);

    // updated_at will be set to timestamp that is 500ms later
    await centralSyncManager.connectToSession(sessionId);

    expect(() => centralSyncManager.connectToSession(sessionId)).not.toThrow();
  });

  it("throws an error when connecting to a session that has taken longer than configured 'syncSessionTimeoutMs'", async () => {
    const centralSyncManager = initializeCentralSyncManager({
      sync: {
        lookupTable: {
          enabled: false,
        },
        syncSessionTimeoutMs: 200,
        maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
      },
    });
    const { sessionId } = await centralSyncManager.startSession();
    await waitForSession(centralSyncManager, sessionId);

    await sleepAsync(500);

    // updated_at will be set to timestamp that is 500ms later
    await centralSyncManager.connectToSession(sessionId);

    await expect(centralSyncManager.connectToSession(sessionId)).rejects.toThrow(
      `Sync session '${sessionId}' encountered an error: Sync session ${sessionId} timed out`,
    );
  });

  it('append error if sync session already encounters an error before', async () => {
    const centralSyncManager = initializeCentralSyncManager();
    const { sessionId } = await centralSyncManager.startSession();
    await waitForSession(centralSyncManager, sessionId);

    const session = await models.SyncSession.findByPk(sessionId);
    await session.markErrored('Error 1');
    await session.markErrored('Error 2');

    expect(session.errors).toEqual(['Error 1', 'Error 2']);
  });
});
