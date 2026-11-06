import config from 'config';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { DEVICE_SCOPES, SERVER_TYPES } from '@tamanu/constants';
import { SYNC_TICK_FLAGS } from '@tamanu/database/sync';
import { fake } from '@tamanu/fake-data/fake';

import { CentralSyncManager } from '../../app/sync/CentralSyncManager';
import { getHighestRealChangeTick } from '../../app/sync/getHighestRealChangeTick';
import { createTestContext } from '../utilities';

const FACILITY_ID = 'changes-pending-facility';
const SYNC_DEVICE_ID = 'changes-pending-sync-device';
const OTHER_DEVICE_ID = 'changes-pending-other-device';

const withLookupTable = enabled => ({
  ...config,
  sync: { ...config.sync, lookupTable: { ...config.sync.lookupTable, enabled } },
});

describe('Changes-pending check', () => {
  let ctx;
  let models;
  let baseApp;
  let syncToken;
  let otherToken;

  const login = async (user, deviceId, scopes) => {
    const response = await baseApp
      .post('/api/login')
      .set('X-Tamanu-Client', SERVER_TYPES.MOBILE)
      .send({ email: user.email, password: 'password', deviceId, scopes });
    expect(response).toHaveSucceeded();
    return response.body.token;
  };

  const check = (token, since) => {
    const request = baseApp.get('/api/sync/pending').set('X-Tamanu-Client', SERVER_TYPES.MOBILE);
    if (token) request.set('Authorization', `Bearer ${token}`);
    if (since !== undefined) request.query({ since });
    return request;
  };

  // inserted directly, because the lookup table's own id column is a serial
  const addLookupRow = (recordId, updatedAtSyncTick, data = { id: recordId }) =>
    ctx.store.sequelize.query(
      `
        INSERT INTO sync_lookup (record_id, record_type, data, updated_at_sync_tick, is_lab_request, is_deleted)
        VALUES (:recordId, 'patients', :data, :updatedAtSyncTick, false, false)
      `,
      {
        replacements: {
          recordId,
          data: data && JSON.stringify(data),
          updatedAtSyncTick,
        },
      },
    );

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;

    const user = await models.User.create(
      fake(models.User, { password: 'password', role: 'admin' }),
    );
    await models.Facility.create(fake(models.Facility, { id: FACILITY_ID, name: FACILITY_ID }));
    syncToken = await login(user, SYNC_DEVICE_ID, [DEVICE_SCOPES.SYNC_CLIENT]);
    otherToken = await login(user, OTHER_DEVICE_ID, []);
  });

  beforeEach(async () => {
    await models.SyncLookup.truncate({ force: true });
    CentralSyncManager.overrideConfig(withLookupTable(true));
  });

  afterEach(() => CentralSyncManager.restoreConfig());

  afterAll(() => ctx.close());

  describe('highest real-change tick', () => {
    it('is null when the lookup table holds nothing', async () => {
      expect(await getHighestRealChangeTick(models)).toBeNull();
    });

    it('is the highest settled tick, ignoring pending-update flags and stubs', async () => {
      await addLookupRow('real-1', 40);
      await addLookupRow('real-2', 50);
      await addLookupRow('pending-update', SYNC_TICK_FLAGS.LOOKUP_PENDING_UPDATE);
      await addLookupRow('incoming', SYNC_TICK_FLAGS.INCOMING_FROM_CENTRAL_SERVER);
      await addLookupRow('elsewhere', SYNC_TICK_FLAGS.LAST_UPDATED_ELSEWHERE);
      // a stub is flagged for rebuild with no data, and carries a placeholder tick
      await addLookupRow('stub', SYNC_TICK_FLAGS.OVERWRITE_WITH_CURRENT_TICK, null);
      await addLookupRow('stub-with-high-placeholder', 9999, null);

      expect(await getHighestRealChangeTick(models)).toBe(50);
    });

    it('moves only when a synced record changes, not when the sync clock advances', async () => {
      const manager = new CentralSyncManager(ctx);

      const patient = await models.Patient.create(fake(models.Patient));
      await manager.updateLookupTable();
      const afterFirstBuild = await getHighestRealChangeTick(models);
      expect(afterFirstBuild).toBeGreaterThan(0);

      // sync sessions and builds advance the clock without any record changing
      await manager.tickTockGlobalClock();
      await manager.tickTockGlobalClock();
      await manager.updateLookupTable();
      expect(await getHighestRealChangeTick(models)).toBe(afterFirstBuild);

      await patient.update({ firstName: 'Changed' });
      await manager.updateLookupTable();
      expect(await getHighestRealChangeTick(models)).toBeGreaterThan(afterFirstBuild);
    });
  });

  describe('GET /api/sync/pending', () => {
    it('rejects a request with no access token', async () => {
      const response = await check(null, 0);
      expect(response).toHaveRequestError();
    });

    it('rejects a device without the sync client scope', async () => {
      await addLookupRow('real-1', 50);
      const response = await check(otherToken, 0);
      expect(response).not.toHaveSucceeded();
    });

    it('answers that there are changes when the device has never pulled', async () => {
      await addLookupRow('real-1', 5);
      const response = await check(syncToken);
      expect(response).toHaveSucceeded();
      expect(response.body).toEqual({ changesToPull: true });
    });

    it('answers that there are changes when the lookup table is empty and the device has never pulled', async () => {
      const response = await check(syncToken);
      expect(response.body).toEqual({ changesToPull: true });
    });

    it('answers that there are changes when the highest tick is above the cursor', async () => {
      await addLookupRow('real-1', 50);
      const response = await check(syncToken, 49);
      expect(response).toHaveSucceeded();
      expect(response.body).toEqual({ changesToPull: true });
    });

    it('answers that there is nothing to pull when the cursor has reached the highest tick', async () => {
      await addLookupRow('real-1', 50);
      expect((await check(syncToken, 50)).body).toEqual({ changesToPull: false });
      expect((await check(syncToken, 80)).body).toEqual({ changesToPull: false });
    });

    it('answers that there is nothing to pull when the lookup table is empty', async () => {
      expect((await check(syncToken, 0)).body).toEqual({ changesToPull: false });
    });

    it('does not count pending-update flags and stubs as changes', async () => {
      await addLookupRow('real-1', 50);
      await addLookupRow('pending-update', SYNC_TICK_FLAGS.LOOKUP_PENDING_UPDATE);
      await addLookupRow('stub', SYNC_TICK_FLAGS.OVERWRITE_WITH_CURRENT_TICK, null);
      await addLookupRow('stub-with-high-placeholder', 9999, null);
      expect((await check(syncToken, 50)).body).toEqual({ changesToPull: false });
    });

    it('always answers that there are changes when the lookup table is turned off', async () => {
      CentralSyncManager.overrideConfig(withLookupTable(false));
      await addLookupRow('real-1', 50);
      const response = await check(syncToken, 50);
      expect(response).toHaveSucceeded();
      expect(response.body).toEqual({ changesToPull: true });
    });

    it('rejects a cursor that is not an integer', async () => {
      expect(await check(syncToken, 'soon')).toHaveRequestError();
      expect(await check(syncToken, '')).toHaveRequestError();
      expect(await check(syncToken, '1.5')).toHaveRequestError();
    });

    it('records the device as seen when its last-seen time is stale', async () => {
      const longAgo = new Date(Date.now() - 60 * 60 * 1000);
      await models.Device.update({ lastSeenAt: longAgo }, { where: { id: SYNC_DEVICE_ID } });

      const response = await check(syncToken, 0);
      expect(response).toHaveSucceeded();

      const device = await models.Device.findByPk(SYNC_DEVICE_ID);
      expect(device.lastSeenAt.getTime()).toBeGreaterThan(longAgo.getTime());
    });
  });

  describe('POST /api/sync', () => {
    it('records the device as seen when its last-seen time is stale', async () => {
      CentralSyncManager.overrideConfig({
        ...withLookupTable(true),
        sync: { ...withLookupTable(true).sync, awaitPreparation: true },
      });
      const longAgo = new Date(Date.now() - 60 * 60 * 1000);
      await models.Device.update({ lastSeenAt: longAgo }, { where: { id: SYNC_DEVICE_ID } });

      const response = await baseApp
        .post('/api/sync')
        .set('X-Tamanu-Client', SERVER_TYPES.MOBILE)
        .set('Authorization', `Bearer ${syncToken}`)
        .send({ facilityIds: [FACILITY_ID], lastSyncedTick: 0, isMobile: true });
      expect(response).toHaveSucceeded();

      const device = await models.Device.findByPk(SYNC_DEVICE_ID);
      expect(device.lastSeenAt.getTime()).toBeGreaterThan(longAgo.getTime());

      await baseApp
        .delete(`/api/sync/${response.body.sessionId}`)
        .set('X-Tamanu-Client', SERVER_TYPES.MOBILE)
        .set('Authorization', `Bearer ${syncToken}`);
    });
  });
});
