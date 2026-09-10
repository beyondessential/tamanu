import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
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

describe('CentralSyncManager push acknowledgement', () => {
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
    await models.SyncDeviceTick.truncate({ force: true });
    await models.Facility.truncate({ cascade: true, force: true });
    await models.User.truncate({ cascade: true, force: true });
    await models.User.create({
      id: SYSTEM_USER_UUID,
      email: 'system',
      displayName: 'System',
      role: 'system',
    });
    await models.LocalSystemFact.set(FACT_LOOKUP_UP_TO_TICK, null);
    await models.DebugLog.truncate({ force: true });
  });

  afterAll(() => ctx.close());

  const pushPatientChange = async (centralSyncManager, deviceId) => {
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, '16');
    const patient = await models.Patient.create({ ...fake(models.Patient), displayId: 'ACK' });
    const changes = [
      {
        direction: SYNC_SESSION_DIRECTION.OUTGOING,
        isDeleted: false,
        recordType: 'patients',
        recordId: patient.id,
        data: { ...patient.dataValues, firstName: 'Changed' },
      },
    ];
    const { sessionId } = await centralSyncManager.startSession({ deviceId });
    await waitForSession(centralSyncManager, sessionId);
    await centralSyncManager.addIncomingChanges(sessionId, changes);
    return { patient, sessionId };
  };

  describe('the persist is atomic with marking the session complete', () => {
    beforeEach(() => vi.resetModules());
    afterEach(() => vi.doUnmock('@tamanu/database/sync'));

    it('rolls the persisted changes back if a step in the persist transaction throws', async () => {
      vi.doMock('@tamanu/database/sync', async () => ({
        ...(await vi.importActual('@tamanu/database/sync')),
        bumpSyncTickForRepull: vi.fn().mockRejectedValue(new Error('boom mid-persist')),
      }));
      const centralSyncManager = await initializeCentralSyncManager();
      const facility = await models.Facility.create(fake(models.Facility));

      const { patient, sessionId } = await pushPatientChange(centralSyncManager, facility.id);
      await centralSyncManager.completePush(sessionId, facility.id);
      await expect(waitForPushCompleted(centralSyncManager, sessionId)).rejects.toThrow();

      // all-or-nothing: the change is not committed and the session is not marked persisted
      await patient.reload();
      expect(patient.firstName).not.toBe('Changed');
      const session = await models.SyncSession.findByPk(sessionId);
      expect(session.persistCompletedAt).toBeNull();
    });

    it('marks the session persisted on the happy path', async () => {
      const centralSyncManager = await initializeCentralSyncManager();
      const facility = await models.Facility.create(fake(models.Facility));

      const { patient, sessionId } = await pushPatientChange(centralSyncManager, facility.id);
      await centralSyncManager.completePush(sessionId, facility.id);
      await waitForPushCompleted(centralSyncManager, sessionId);

      await patient.reload();
      expect(patient.firstName).toBe('Changed');
      const session = await models.SyncSession.findByPk(sessionId);
      expect(session.persistCompletedAt).not.toBeNull();
    });
  });

  describe('getPushStatus', () => {
    it('returns the persist timestamp to the owning device, on a completed session', async () => {
      const centralSyncManager = await initializeCentralSyncManager();
      const facility = await models.Facility.create(fake(models.Facility));
      const { sessionId } = await pushPatientChange(centralSyncManager, facility.id);
      await centralSyncManager.completePush(sessionId, facility.id);
      await waitForPushCompleted(centralSyncManager, sessionId);
      await centralSyncManager.endSession(sessionId);

      const { persistCompletedAt } = await centralSyncManager.getPushStatus(sessionId, facility.id);
      expect(persistCompletedAt).not.toBeNull();
    });

    it('rejects a device reading another device session', async () => {
      const centralSyncManager = await initializeCentralSyncManager();
      const facility = await models.Facility.create(fake(models.Facility));
      const { sessionId } = await pushPatientChange(centralSyncManager, facility.id);

      await expect(centralSyncManager.getPushStatus(sessionId, 'someone-else')).rejects.toThrow();
    });

    it('rejects an unknown session', async () => {
      const centralSyncManager = await initializeCentralSyncManager();
      await expect(
        centralSyncManager.getPushStatus('does-not-exist', 'facility-x'),
      ).rejects.toThrow();
    });
  });
});
