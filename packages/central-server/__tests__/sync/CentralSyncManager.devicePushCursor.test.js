import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { FACT_CURRENT_SYNC_TICK, FACT_LOOKUP_UP_TO_TICK } from '@tamanu/constants/facts';
import { SYNC_SESSION_DIRECTION } from '@tamanu/database/sync';
import { fake } from '@tamanu/fake-data/fake';
import { SYSTEM_USER_UUID } from '@tamanu/constants';

import {
  createTestContext,
  waitForSession,
  waitForPushCompleted,
  initializeCentralSyncManagerWithContext,
} from '../utilities';

// Central records how far each device has pushed, so it is the authority on a client's push
// progress and a client restored from a snapshot that diverges from central re-pushes what central
// is missing rather than skipping it. See spec PUSH.
describe('CentralSyncManager device push cursor', () => {
  let ctx;
  let models;

  const initializeCentralSyncManager = config =>
    initializeCentralSyncManagerWithContext(ctx, config);

  const createDevice = async () =>
    models.Device.create({ id: fake(models.Facility).id, registeredById: SYSTEM_USER_UUID });

  const pushPatientUpdate = async (device, pushCursor) => {
    const patient = await models.Patient.create({ ...fake(models.Patient) });
    const changes = [
      {
        direction: SYNC_SESSION_DIRECTION.OUTGOING,
        isDeleted: false,
        recordType: 'patients',
        recordId: patient.id,
        data: { ...patient.dataValues, firstName: 'Changed' },
      },
    ];

    const centralSyncManager = await initializeCentralSyncManager();
    const { sessionId } = await centralSyncManager.startSession({ deviceId: device.id });
    await waitForSession(centralSyncManager, sessionId);
    await centralSyncManager.addIncomingChanges(sessionId, changes);
    await centralSyncManager.completePush(sessionId, device.id, undefined, pushCursor);
    await waitForPushCompleted(centralSyncManager, sessionId);
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models } = ctx.store);
  });

  beforeEach(async () => {
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, 2);
    await models.SyncDeviceTick.truncate({ force: true });
    await models.Device.truncate({ cascade: true, force: true });
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
    vi.resetModules();
  });

  afterAll(() => ctx.close());

  it('records the reported cursor when a push is persisted', async () => {
    const device = await createDevice();

    await pushPatientUpdate(device, 42);

    await device.reload();
    expect(Number(device.lastSuccessfulSyncPush)).toBe(42);
  });

  it('advances the cursor to a higher reported value', async () => {
    const device = await createDevice();
    await device.update({ lastSuccessfulSyncPush: 10 });

    await pushPatientUpdate(device, 42);

    await device.reload();
    expect(Number(device.lastSuccessfulSyncPush)).toBe(42);
  });

  it('never moves the cursor backwards', async () => {
    const device = await createDevice();
    await device.update({ lastSuccessfulSyncPush: 42 });

    // a client restored behind central reports a lower cursor; central must not regress
    await pushPatientUpdate(device, 10);

    await device.reload();
    expect(Number(device.lastSuccessfulSyncPush)).toBe(42);
  });

  it('returns the stored cursor in the session metadata', async () => {
    const device = await createDevice();
    await device.update({ lastSuccessfulSyncPush: 42 });

    const centralSyncManager = await initializeCentralSyncManager();
    const { sessionId } = await centralSyncManager.startSession({ deviceId: device.id });
    await waitForSession(centralSyncManager, sessionId);

    const { lastSuccessfulPush } = await centralSyncManager.fetchSyncMetadata(sessionId);
    expect(lastSuccessfulPush).toBe(42);
  });

  it('returns a null cursor in the metadata for a device that has never pushed', async () => {
    const device = await createDevice();

    const centralSyncManager = await initializeCentralSyncManager();
    const { sessionId } = await centralSyncManager.startSession({ deviceId: device.id });
    await waitForSession(centralSyncManager, sessionId);

    const { lastSuccessfulPush } = await centralSyncManager.fetchSyncMetadata(sessionId);
    expect(lastSuccessfulPush).toBeNull();
  });
});
