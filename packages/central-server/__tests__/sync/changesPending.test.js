import config from 'config';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { DEVICE_SCOPES, SERVER_TYPES } from '@tamanu/constants';
import { SYNC_TICK_FLAGS } from '@tamanu/database/sync';
import { fake } from '@tamanu/fake-data/fake';

import { CentralSyncManager } from '../../app/sync/CentralSyncManager';
import { getHighestRealChangeTick } from '../../app/sync/getHighestRealChangeTick';
import { createTestContext } from '../utilities';

const SYNC_DEVICE_ID = 'changes-pending-sync-device';

const withLookupTable = enabled => ({
  ...config,
  sync: { ...config.sync, lookupTable: { ...config.sync.lookupTable, enabled } },
});

describe('Changes-pending check', () => {
  let ctx;
  let models;
  let baseApp;
  let syncToken;

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

  let nextLookupId = 1;
  const addLookupRow = (recordId, updatedAtSyncTick, data = { id: recordId }) =>
    models.SyncLookup.create({
      id: nextLookupId++,
      recordId,
      recordType: 'patients',
      data,
      updatedAtSyncTick,
      isLabRequest: false,
      isDeleted: false,
    });

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;

    const user = await models.User.create(
      fake(models.User, { password: 'password', role: 'admin' }),
    );
    syncToken = await login(user, SYNC_DEVICE_ID, [DEVICE_SCOPES.SYNC_CLIENT]);
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
      // a stub has no data, and a placeholder tick
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

    it.each([
      ['the device has never pulled', [5], undefined, true],
      ['the device has never pulled and the lookup table is empty', [], undefined, true],
      ['the highest tick is above the cursor', [50], 49, true],
      ['the cursor has reached the highest tick', [50], 50, false],
      ['the cursor is past the highest tick', [50], 80, false],
      ['the lookup table is empty', [], 0, false],
    ])('answers on the flag when %s', async (_situation, ticks, since, changesToPull) => {
      await Promise.all(ticks.map((tick, i) => addLookupRow(`real-${i}`, tick)));
      const response = await check(syncToken, since);
      expect(response).toHaveSucceeded();
      expect(response.body).toEqual({ changesToPull });
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
  });
});
