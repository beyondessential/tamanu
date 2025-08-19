import { beforeAll, describe, it } from '@jest/globals';
import { fake } from '@tamanu/fake-data/fake';
import { toDateTimeString } from '@tamanu/utils/dateTime';
import { subMinutes } from 'date-fns';

import { createTestContext } from '../utilities';
import { SERVER_TYPES } from '@tamanu/constants';

describe('SyncQueuedDevice', () => {
  let ctx;
  let models;
  let baseApp;
  let app;
  let token;

  const closeActiveSyncSessions = async () => {
    await models.SyncSession.update(
      {
        completedAt: new Date(),
      },
      { where: {} },
    );
  };

  const requestSync = async (device, lastSyncedTick = 0, urgent = false) => {
    const result = await app
      .post('/api/sync')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tamanu-Client', SERVER_TYPES.MOBILE)
      .send({
        deviceId: `queue-${device}`,
        facilityIds: [`facility${device}`],
        lastSyncedTick,
        urgent,
      });
    expect(result).toHaveSucceeded();
    return result;
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;
    app = await baseApp.asRole('admin');

    await Promise.all(
      ['facilityA', 'facilityB', 'facilityC', 'facilityD', 'facilityE'].map(id =>
        models.Facility.create(fake(models.Facility, { id, name: id })),
      ),
    );

    const user = await models.User.create(fake(models.User, { password: 'password' }));
    const device = await models.Device.create({ registeredById: user.id });
    const response = await baseApp
      .post('/api/login')
      .set('X-Tamanu-Client', SERVER_TYPES.MOBILE)
      .send({
        email: user.email,
        password: 'password',
        deviceId: device.id,
      });
    token = response.body.token;

    const { CentralSyncManager } = require('../../dist/sync/CentralSyncManager');
    CentralSyncManager.overrideConfig({
      sync: {
        awaitPreparation: true,
        maxConcurrentSessions: 1,
        maxRecordsPerSnapshotChunk: 1000000000,
        lookupTable: {
          enabled: true,
        },
      },
    });

    await new CentralSyncManager(ctx).updateLookupTable();
  });

  beforeEach(async () => {
    await models.SyncSession.truncate({ cascade: true, force: true });
    await models.SyncQueuedDevice.truncate({ cascade: true, force: true });
  });

  afterAll(() => ctx.close());

  describe('Basic queueing', () => {
    it('Should start a sync if the queue is empty', async () => {
      const result = await requestSync('A');
      expect(result.body).toHaveProperty('sessionId');
    });

    it('Should queue if a sync is running', async () => {
      const resultA = await requestSync('A');
      expect(resultA.body).toHaveProperty('sessionId');

      const resultB = await requestSync('B');
      // we're first in line (device A having been removed from the queue to start its sync)
      // but we are waiting for that sync to complete
      expect(resultB.body).toHaveProperty('status', 'activeSync');

      const resultC = await requestSync('C');
      // we're behind facility B
      expect(resultC.body).toHaveProperty('status', 'waitingInQueue');
    });

    it('Should pick the oldest syncedTick device given uniform urgency', async () => {
      const resultA = await requestSync('A'); // start active sync
      expect(resultA.body).toHaveProperty('sessionId');

      // get some sessions in the queue
      await requestSync('B', 100);
      await requestSync('C', 200);
      await requestSync('D', 300);
      await requestSync('E', 10);

      await closeActiveSyncSessions();

      const waiting = await requestSync('D', 300);
      expect(waiting.body).toHaveProperty('status', 'waitingInQueue');

      const started = await requestSync('E', 10);
      expect(started.body).toHaveProperty('sessionId');
    });

    it('Should prioritise urgent over lastSyncedTick', async () => {
      const resultA = await requestSync('A'); // start active sync
      expect(resultA.body).toHaveProperty('sessionId');

      // get some sessions in the queue
      await requestSync('B', 100);
      await requestSync('C', 200, true);
      await requestSync('D', 300);
      await requestSync('E', 10);

      await closeActiveSyncSessions();

      const waiting = await requestSync('E', 10);
      expect(waiting.body).toHaveProperty('status', 'waitingInQueue');

      const started = await requestSync('C', 200); // previous urgent flag should stick
      expect(started.body).toHaveProperty('sessionId');
    });

    it('Should cancel a session if that device re-queues', async () => {
      const resultA = await requestSync('A'); // start active sync
      expect(resultA.body).toHaveProperty('sessionId');

      await requestSync('B', 100);
      await requestSync('C', 200, true); // this one will be at the front
      await requestSync('D', 300);
      await requestSync('E', 10);

      const resultTerminate = await requestSync('A', 100);
      // I had a session but it was terminated - now I'm just a regular part of the queue
      expect(resultTerminate.body).toHaveProperty('status', 'waitingInQueue');

      const started = await requestSync('C', 200); // new front-of-queue should succeed
      expect(started.body).toHaveProperty('sessionId');
    });

    it('Should exclude an old session from the queue', async () => {
      const resultA = await requestSync('A'); // start active sync
      expect(resultA.body).toHaveProperty('sessionId');

      await requestSync('B', 100);
      await requestSync('C', 200, true);

      // wrap up the A session so that B and C can compete for next spot
      await closeActiveSyncSessions();

      // B should be waiting behind C
      const resultCheck = await requestSync('B', 100);
      expect(resultCheck.body).toHaveProperty('status', 'waitingInQueue');

      // now grab the queue record for C and backdate it to ages ago
      const queuedDeviceC = await models.SyncQueuedDevice.findByPk('queue-C');
      await queuedDeviceC.update({
        lastSeenTime: toDateTimeString(subMinutes(new Date(), 300)),
      });

      // now our B device should be at the front of the queue
      const started = await requestSync('B', 200);
      expect(started.body).toHaveProperty('sessionId');
    });
  });
});
