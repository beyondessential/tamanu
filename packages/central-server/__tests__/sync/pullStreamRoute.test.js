import { beforeAll, describe, expect, it } from '@jest/globals';

import {
  DEVICE_SCOPES,
  SERVER_TYPES,
  SETTINGS_SCOPES,
  SYNC_STREAM_MESSAGE_KIND,
} from '@tamanu/constants';
import { FACT_CURRENT_SYNC_TICK } from '@tamanu/constants/facts';
import { settingsCache } from '@tamanu/settings';
import { fake } from '@tamanu/fake-data/fake';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

import { createTestContext } from '../utilities';

const DEVICE_ID = 'pull-stream-device';
// one record per page, so the route has to page: the cursor it hands itself is what is under test,
// and it is only exercised from the second iteration onwards
const PAGE_SIZE = 1;

/**
 * The stream is a sequence of frames, each CRLF, a two-byte kind, a four-byte payload length, and
 * that many bytes of JSON. Built by StreamMessage on the server and read by TamanuApi#stream on the
 * client; parsed here rather than reused because the client's reader wants a live fetch response.
 */
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

    const { CentralSyncManager } = require('../../app/sync/CentralSyncManager');
    CentralSyncManager.overrideConfig({
      sync: {
        // the routes hand the snapshot off to the background and the client polls for it; awaiting
        // preparation takes that race out of the test without changing what is under test
        awaitPreparation: true,
        maxRecordsPerSnapshotChunk: 1000000000,
        lookupTable: { enabled: true },
      },
    });

    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, 2);

    facility = await models.Facility.create(fake(models.Facility));
    // several records of a kind that pulls to every facility, so the snapshot spans several pages
    await models.Program.create(fake(models.Program));
    await models.Program.create(fake(models.Program));
    await models.Program.create(fake(models.Program));

    // outgoing snapshots are built from the lookup table, so it has to know about those records
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

  it('streams every record in the snapshot, paging itself through it', async () => {
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

    // the snapshot is built in the background, and the stream route refuses until it is done
    let ready = false;
    for (let attempt = 0; attempt < 40 && !ready; attempt++) {
      const readyCheck = await asDevice(baseApp.get(`/api/sync/${sessionId}/pull/ready`));
      ready = readyCheck.body === true;
      if (!ready) await sleepAsync(100);
    }
    expect(ready).toBe(true);

    // comes back as a string, being a SQL count
    const totalToPull = Number(
      (await asDevice(baseApp.get(`/api/sync/${sessionId}/pull/metadata`))).body.totalToPull,
    );
    expect(totalToPull).toBeGreaterThan(PAGE_SIZE);

    // the frames are served as application/json+frame, which superagent would otherwise hand to its
    // JSON parser on the strength of the substring; take the bytes instead
    const streamed = await asDevice(baseApp.get(`/api/sync/${sessionId}/pull/stream`)).responseType(
      'blob',
    );
    expect(streamed.status).toBe(200);

    const frames = parseStreamFrames(streamed.body);
    const changes = frames
      .filter(({ kind }) => kind === SYNC_STREAM_MESSAGE_KIND.PULL_CHANGE)
      .map(({ message }) => message);

    // every record exactly once: a cursor that failed to advance would repeat the first page, and one
    // that skipped would come up short
    expect(changes).toHaveLength(totalToPull);
    expect(new Set(changes.map(({ recordId }) => recordId)).size).toBe(totalToPull);
    expect(frames.at(-1).kind).toBe(SYNC_STREAM_MESSAGE_KIND.END);
  });
});
