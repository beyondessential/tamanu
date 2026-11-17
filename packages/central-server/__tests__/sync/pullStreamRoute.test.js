import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  DEVICE_SCOPES,
  SERVER_TYPES,
  SETTINGS_SCOPES,
  SYNC_STREAM_MESSAGE_KIND,
} from '@tamanu/constants';
import { FACT_CURRENT_SYNC_TICK } from '@tamanu/constants/facts';
import { settingsCache } from '@tamanu/settings';
import { encodeSnapshotCursor } from '@tamanu/database/sync';
import { fake } from '@tamanu/fake-data/fake';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

import { CentralSyncManager } from '../../app/sync/CentralSyncManager';
import { createTestContext } from '../utilities';

const DEVICE_ID = 'pull-stream-device';
const PAGE_SIZE = 1;

// Each frame: CRLF, u16 kind, u32 length, JSON body. TamanuApi#stream needs a live fetch response.
const parseStreamFrames = buffer => {
  const frames = [];
  let offset = 0;
  while (offset + 8 <= buffer.length) {
    const kind = buffer.readUInt16BE(offset + 2);
    const length = buffer.readUInt32BE(offset + 4);
    const body = buffer.subarray(offset + 8, offset + 8 + length);
    frames.push({ kind, message: length > 0 ? JSON.parse(body.toString('utf8')) : undefined });
    offset += 8 + length;
  }
  return frames;
};

describe('GET /sync/:sessionId/pull/stream', () => {
  let ctx;
  let baseApp;
  let models;
  let facility;
  let token;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;

    const user = await models.User.create(fake(models.User, { password: 'password' }));
    await models.Device.create(
      fake(models.Device, {
        id: DEVICE_ID,
        registeredById: user.id,
        scopes: [DEVICE_SCOPES.SYNC_CLIENT],
      }),
    );

    CentralSyncManager.overrideConfig({
      sync: {
        awaitPreparation: true,
        maxRecordsPerSnapshotChunk: 1000000000,
        lookupTable: { enabled: true },
      },
    });

    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, 2);

    facility = await models.Facility.create(fake(models.Facility));
    await models.Program.create(fake(models.Program));
    await models.Program.create(fake(models.Program));
    await models.Program.create(fake(models.Program));

    await new CentralSyncManager(ctx).updateLookupTable();

    await models.Setting.set(
      'sync.streaming.databasePollBatchSize',
      PAGE_SIZE,
      SETTINGS_SCOPES.CENTRAL,
    );
    settingsCache.reset();

    const login = await baseApp
      .post('/api/login')
      .set('X-Tamanu-Client', SERVER_TYPES.FACILITY)
      .send({
        email: user.email,
        password: 'password',
        deviceId: DEVICE_ID,
        scopes: [DEVICE_SCOPES.SYNC_CLIENT],
      });
    expect(login).toHaveSucceeded();
    token = login.body.token;
  });

  afterAll(async () => {
    await models.Setting.destroy({ where: { key: 'sync.streaming.databasePollBatchSize' } });
    settingsCache.reset();
    await ctx.close();
  });

  const asDevice = request =>
    request.set('Authorization', `Bearer ${token}`).set('X-Tamanu-Client', SERVER_TYPES.FACILITY);

  const streamChanges = async (sessionId, query = {}) => {
    // superagent would JSON-parse application/json+frame
    const streamed = await asDevice(baseApp.get(`/api/sync/${sessionId}/pull/stream`))
      .query(query)
      .responseType('blob');
    expect(streamed.status).toBe(200);
    const frames = parseStreamFrames(streamed.body);
    expect(frames.at(-1).kind).toBe(SYNC_STREAM_MESSAGE_KIND.END);
    return frames
      .filter(({ kind }) => kind === SYNC_STREAM_MESSAGE_KIND.PULL_CHANGE)
      .map(({ message }) => message);
  };

  const startReadyPull = async () => {
    const session = await asDevice(baseApp.post('/api/sync')).send({
      facilityIds: [facility.id],
      lastSyncedTick: 1,
    });
    expect(session).toHaveSucceeded();
    const { sessionId } = session.body;

    const initiated = await asDevice(baseApp.post(`/api/sync/${sessionId}/pull/initiate`)).send({
      since: 1,
      facilityIds: [facility.id],
    });
    expect(initiated).toHaveSucceeded();

    let ready = false;
    for (let attempt = 0; attempt < 40 && !ready; attempt++) {
      const readyCheck = await asDevice(baseApp.get(`/api/sync/${sessionId}/pull/ready`));
      ready = readyCheck.body === true;
      if (!ready) await sleepAsync(100);
    }
    expect(ready).toBe(true);

    return sessionId;
  };

  it('streams every record in the snapshot, paging itself through it', async () => {
    const sessionId = await startReadyPull();

    const totalToPull = Number(
      (await asDevice(baseApp.get(`/api/sync/${sessionId}/pull/metadata`))).body.totalToPull,
    );
    expect(totalToPull).toBeGreaterThan(PAGE_SIZE);

    const changes = await streamChanges(sessionId);

    expect(changes).toHaveLength(totalToPull);
    expect(new Set(changes.map(({ recordId }) => recordId)).size).toBe(totalToPull);
  });

  it('resumes after the record in the cursor', async () => {
    const sessionId = await startReadyPull();
    const allChanges = await streamChanges(sessionId);

    const resumed = await streamChanges(sessionId, { fromId: encodeSnapshotCursor(allChanges[0]) });

    expect(resumed.map(({ recordId }) => recordId)).toEqual(
      allChanges.slice(1).map(({ recordId }) => recordId),
    );
  });

  it('rejects a malformed cursor before the stream starts', async () => {
    const sessionId = await startReadyPull();

    const response = await asDevice(
      baseApp.get(`/api/sync/${sessionId}/pull/stream`).query({ fromId: 'not-a-cursor' }),
    );

    expect(response).toHaveRequestError();
  });
});
