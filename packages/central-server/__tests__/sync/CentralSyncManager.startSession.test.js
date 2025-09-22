import { FACT_CURRENT_SYNC_TICK, FACT_LOOKUP_UP_TO_TICK } from '@tamanu/constants/facts';
import { SYSTEM_USER_UUID } from '@tamanu/constants';
import { fakeUser } from '@tamanu/fake-data/fake';

import {
  createTestContext,
  waitForSession,
  initializeCentralSyncManagerWithContext,
} from '../utilities';
import { cloneDeep } from 'lodash';

describe('CentralSyncManager.startSession', () => {
  let ctx;
  let models;

  const DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS = 100000000;
  const initializeCentralSyncManager = config =>
    initializeCentralSyncManagerWithContext(ctx, config);

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

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models } = ctx.store);
  });

  beforeEach(async () => {
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, 2);
    await models.SyncLookupTick.truncate({ force: true });
    await models.SyncDeviceTick.truncate({ force: true });
    await models.Facility.truncate({ cascade: true, force: true });
    await models.Program.truncate({ cascade: true, force: true });
    await models.ProgramDataElement.truncate({ cascade: true, force: true });
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

  it('creates a new session', async () => {
    const centralSyncManager = initializeCentralSyncManager();
    const { sessionId } = await centralSyncManager.startSession();
    await waitForSession(centralSyncManager, sessionId);

    const syncSession = await models.SyncSession.findOne({ where: { id: sessionId } });
    expect(syncSession).not.toBeUndefined();
  });

  it('tick-tocks the global clock', async () => {
    const centralSyncManager = initializeCentralSyncManager();
    const { sessionId } = await centralSyncManager.startSession();

    await waitForSession(centralSyncManager, sessionId);

    const localSystemFact = await models.LocalSystemFact.findOne({
      where: { key: FACT_CURRENT_SYNC_TICK },
    });
    expect(parseInt(localSystemFact.value, 10)).toBe(2 + 2);
  });

  it('allows concurrent sync sessions', async () => {
    const centralSyncManager = initializeCentralSyncManager();
    const { sessionId: sessionId1 } = await centralSyncManager.startSession();
    const { sessionId: sessionId2 } = await centralSyncManager.startSession();

    await waitForSession(centralSyncManager, sessionId1);
    await waitForSession(centralSyncManager, sessionId2);

    const syncSession1 = await models.SyncSession.findOne({ where: { id: sessionId1 } });
    const syncSession2 = await models.SyncSession.findOne({ where: { id: sessionId2 } });

    expect(syncSession1).not.toBeUndefined();
    expect(syncSession2).not.toBeUndefined();
  });

  it('A large number of concurrent sessions will not consume the database connection pool', async () => {
    const centralSyncManager = initializeCentralSyncManager({
      sync: {
        lookupTable: {
          enabled: false,
        },
        maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
        awaitPreparation: true,
      },
    });
    const startSessionPromises = [];
    for (let i = 0; i < 10; i++) {
      startSessionPromises.push(centralSyncManager.startSession());
    }

    const sessionResults = await Promise.allSettled(startSessionPromises);

    const failedSessions = sessionResults.filter(result => result.status === 'rejected');
    expect(failedSessions.length).toBeGreaterThan(0); // Check to ensure the test is actually testing something

    for (const failedSession of failedSessions) {
      expect(failedSession.reason.message).toMatch(
        /Failed to create sync session, server may be overloaded with sync requests/,
      );
    }

    const newUser = await models.User.create(fakeUser());
    expect(newUser).not.toBeUndefined(); // Checking we can still interact with the database
  });

  it('throws an error when checking a session is ready if it failed to start', async () => {
    const errorMessage = "I'm a sleepy session, I don't want to start";
    const fakeMarkAsStartedAt = () => {
      throw new Error(errorMessage);
    };

    const spyMarkAsStartedAt = jest
      .spyOn(models.SyncSession.prototype, 'markAsStartedAt')
      .mockImplementation(fakeMarkAsStartedAt);

    const centralSyncManager = initializeCentralSyncManager();
    const { sessionId } = await centralSyncManager.startSession();

    await expect(waitForSession(centralSyncManager, sessionId))
      .rejects.toThrow(`Sync session '${sessionId}' encountered an error: ${errorMessage}`)
      .finally(() => spyMarkAsStartedAt.mockRestore());
  });

  it('throws an error if the sync lookup table has not yet built', async () => {
    const centralSyncManager = initializeCentralSyncManager({
      sync: {
        lookupTable: {
          enabled: true,
        },
        maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
      },
    });
    const { sessionId } = await centralSyncManager.startSession();
    await expect(waitForSession(centralSyncManager, sessionId)).rejects.toThrow(
      `Sync session '${sessionId}' encountered an error: Sync lookup table has not yet built. Cannot initiate sync.`,
    );
  });

  it('throws an error when checking a session is ready if it never assigned a started_at_tick', async () => {
    const fakeMarkAsStartedAt = () => {
      // Do nothing and ensure we error out when the client starts polling
    };

    const spyMarkAsStartedAt = jest
      .spyOn(models.SyncSession.prototype, 'markAsStartedAt')
      .mockImplementation(fakeMarkAsStartedAt);

    const centralSyncManager = initializeCentralSyncManager();
    const { sessionId } = await centralSyncManager.startSession();

    await expect(waitForSession(centralSyncManager, sessionId))
      .rejects.toThrow(
        new RegExp(
          `Sync session '${sessionId}' encountered an error: Session initiation incomplete, likely because the central server restarted during the process`,
        ),
      )
      .finally(() => spyMarkAsStartedAt.mockRestore());
  });

  /**
   * Since the client is polling to see if the session has started, its important we only mark as started once everything is complete
   */
  it('performs no further operations after flagging the session as started', async () => {
    const centralSyncManager = initializeCentralSyncManager();
    const originalPrepareSession = centralSyncManager.prepareSession.bind(centralSyncManager);
    let dataValuesAtStartTime = null;

    const fakeCentralSyncManagerPrepareSession = session => {
      const originalMarkAsStartedAt = session.markAsStartedAt.bind(session);
      const fakeSessionMarkAsStartedAt = async tick => {
        const result = await originalMarkAsStartedAt(tick);
        await session.reload();
        dataValuesAtStartTime = cloneDeep(session.dataValues); // Save dataValues immediately after marking session as started
        return result;
      };
      jest.spyOn(session, 'markAsStartedAt').mockImplementation(fakeSessionMarkAsStartedAt);
      return originalPrepareSession(session);
    };

    jest
      .spyOn(centralSyncManager, 'prepareSession')
      .mockImplementation(fakeCentralSyncManagerPrepareSession);

    const { sessionId } = await centralSyncManager.startSession();

    await waitForSession(centralSyncManager, sessionId);
    const latestValues = (await models.SyncSession.findOne({ where: { id: sessionId } }))
      .dataValues;

    expectMatchingSessionData(latestValues, dataValuesAtStartTime);
  });
});
