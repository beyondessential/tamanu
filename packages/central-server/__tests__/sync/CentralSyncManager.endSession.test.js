import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { FACT_CURRENT_SYNC_TICK, FACT_LOOKUP_UP_TO_TICK } from '@tamanu/constants/facts';
import { SYSTEM_USER_UUID } from '@tamanu/constants';

import {
  createTestContext,
  waitForSession,
  initializeCentralSyncManagerWithContext,
} from '../utilities';

describe('CentralSyncManager.endSession', () => {
  let ctx;
  let models;

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
    await models.LocalSystemFact.set(FACT_LOOKUP_UP_TO_TICK, null);
    await models.SyncLookup.truncate({ force: true });
    await models.DebugLog.truncate({ force: true });
  });

  afterAll(() => ctx.close());

  it('set completedAt when ending an existing session', async () => {
    const centralSyncManager = await initializeCentralSyncManager();
    const { sessionId } = await centralSyncManager.startSession();
    await waitForSession(centralSyncManager, sessionId);

    await centralSyncManager.endSession(sessionId);
    const syncSession2 = await models.SyncSession.findOne({ where: { id: sessionId } });
    expect(syncSession2.completedAt).not.toBeUndefined();
  });

  it('throws an error when connecting to a session that already ended', async () => {
    const centralSyncManager = await initializeCentralSyncManager();
    const { sessionId } = await centralSyncManager.startSession();
    await waitForSession(centralSyncManager, sessionId);

    await centralSyncManager.endSession(sessionId);
    await expect(centralSyncManager.connectToSession(sessionId)).rejects.toThrow();
  });

  it('does nothing when ending a session that has already ended', async () => {
    const centralSyncManager = await initializeCentralSyncManager();
    const { sessionId } = await centralSyncManager.startSession();
    await waitForSession(centralSyncManager, sessionId);

    await centralSyncManager.endSession(sessionId);
    const sessionAfterFirstEnd = await models.SyncSession.findOne({ where: { id: sessionId } });

    await expect(centralSyncManager.endSession(sessionId)).resolves.toBeUndefined();
    const sessionAfterSecondEnd = await models.SyncSession.findOne({ where: { id: sessionId } });

    expect(sessionAfterSecondEnd.completedAt).toEqual(sessionAfterFirstEnd.completedAt);
    expect(sessionAfterSecondEnd.updatedAt).toEqual(sessionAfterFirstEnd.updatedAt);
    expect(sessionAfterSecondEnd.errors).toBeNull();
  });

  it('throws an error when ending a session that already ended with an error', async () => {
    const centralSyncManager = await initializeCentralSyncManager();
    const { sessionId } = await centralSyncManager.startSession();
    await waitForSession(centralSyncManager, sessionId);

    await centralSyncManager.endSession(sessionId, 'The sync failed on the client');
    await expect(centralSyncManager.endSession(sessionId)).rejects.toThrow();
  });

  it('throws an error when reporting an error on a session that already ended cleanly', async () => {
    const centralSyncManager = await initializeCentralSyncManager();
    const { sessionId } = await centralSyncManager.startSession();
    await waitForSession(centralSyncManager, sessionId);

    await centralSyncManager.endSession(sessionId);
    await expect(
      centralSyncManager.endSession(sessionId, 'The sync failed on the client'),
    ).rejects.toThrow();

    const session = await models.SyncSession.findOne({ where: { id: sessionId } });
    expect(session.errors).toBeNull();
  });
});
