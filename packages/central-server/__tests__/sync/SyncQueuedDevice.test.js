import { beforeAll, describe, it } from '@jest/globals';
import { Op } from 'sequelize';
import { fake } from '@tamanu/fake-data/fake';
import { toDateTimeString } from '@tamanu/utils/dateTime';
import { subMinutes } from 'date-fns';

import { sleepAsync } from '@tamanu/utils/sleepAsync';

import { createTestContext } from '../utilities';
import { DEVICE_SCOPES, SERVER_TYPES } from '@tamanu/constants';

const MAX_CONCURRENT_SESSIONS = 1;

[true, false].map(withDeviceIdInBody =>
  describe(`SyncQueuedDevice${withDeviceIdInBody ? ' (with legacy device ID in sync request body)' : ''}`, () => {
    let ctx;
    let models;
    let baseApp;
    let user;

    const closeActiveSyncSessions = async () => {
      await models.SyncSession.update(
        {
          completedAt: new Date(),
        },
        { where: {} },
      );
    };

    const requestSync = async (device, lastSyncedTick = 0, urgent = false) => {
      const result = await requestSyncUnchecked(device, lastSyncedTick, urgent);
      expect(result).toHaveSucceeded();
      return result;
    };

    const requestSyncUnchecked = async (device, lastSyncedTick = 0, urgent = false) => {
      const response = await baseApp
        .post('/api/login')
        .set('X-Tamanu-Client', SERVER_TYPES.MOBILE)
        .send({
          email: user.email,
          password: 'password',
          deviceId: `queue-${device}`,
          scopes: [DEVICE_SCOPES.SYNC_CLIENT],
        });

      return baseApp
        .post('/api/sync')
        .set('Authorization', `Bearer ${response.body.token}`)
        .set('X-Tamanu-Client', SERVER_TYPES.MOBILE)
        .send({
          deviceId: withDeviceIdInBody ? `queue-${device}` : undefined,
          facilityIds: [`facility${device}`],
          lastSyncedTick,
          urgent,
        });
    };

    beforeAll(async () => {
      ctx = await createTestContext();
      baseApp = ctx.baseApp;
      models = ctx.store.models;
      user = await models.User.create(fake(models.User, { password: 'password', role: 'admin' }));

      await Promise.all(
        ['facilityA', 'facilityB', 'facilityC', 'facilityD', 'facilityE'].map(id =>
          models.Facility.create(fake(models.Facility, { id, name: id })),
        ),
      );

      await Promise.all(
        ['A', 'B', 'C', 'D', 'E'].map(id =>
          models.Device.create(
            fake(models.Device, {
              id: `queue-${id}`,
              registeredById: user.id,
              scopes: [DEVICE_SCOPES.SYNC_CLIENT],
            }),
          ),
        ),
      );

      const { CentralSyncManager } = require('../../dist/sync/CentralSyncManager');
      CentralSyncManager.overrideConfig({
        sync: {
          awaitPreparation: true,
          maxConcurrentSessions: MAX_CONCURRENT_SESSIONS,
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

    it('Should start a sync if the queue is empty', async () => {
      const result = await requestSync('A');
      expect(result.body).toHaveProperty('status', 'goodToGo');
      expect(result.body).toHaveProperty('sessionId');
    });

    it('Should queue if a sync is running', async () => {
      const resultA = await requestSync('A');
      expect(resultA.body).toHaveProperty('status', 'goodToGo');
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
      expect(resultA.body).toHaveProperty('status', 'goodToGo');
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
      expect(started.body).toHaveProperty('status', 'goodToGo');
      expect(started.body).toHaveProperty('sessionId');
    });

    it('Should prioritise urgent over lastSyncedTick', async () => {
      const resultA = await requestSync('A'); // start active sync
      expect(resultA.body).toHaveProperty('status', 'goodToGo');
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
      expect(started.body).toHaveProperty('status', 'goodToGo');
      expect(started.body).toHaveProperty('sessionId');
    });

    it('Should cancel a session if that device re-queues', async () => {
      const resultA = await requestSync('A'); // start active sync
      expect(resultA.body).toHaveProperty('status', 'goodToGo');
      expect(resultA.body).toHaveProperty('sessionId');

      await requestSync('B', 100);
      await requestSync('C', 200, true); // this one will be at the front
      await requestSync('D', 300);
      await requestSync('E', 10);

      const resultTerminate = await requestSync('A', 100);
      // I had a session but it was terminated - now I'm just a regular part of the queue
      expect(resultTerminate.body).toHaveProperty('status', 'waitingInQueue');

      const started = await requestSync('C', 200); // new front-of-queue should succeed
      expect(started.body).toHaveProperty('status', 'goodToGo');
      expect(started.body).toHaveProperty('sessionId');
    });

    it('Should exclude an old session from the queue', async () => {
      const resultA = await requestSync('A'); // start active sync
      expect(resultA.body).toHaveProperty('status', 'goodToGo');
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
      expect(started.body).toHaveProperty('status', 'goodToGo');
      expect(started.body).toHaveProperty('sessionId');
    });

    it('Should prevent exceeding maxConcurrentSessions when many syncs are requested at once', async () => {
      const sessions = ['A', 'B', 'C'];
      let sessionsAttempted = 0;
      let allSessionsAttemptedPromise;
      let allSessionsAttemptedResolve;
      allSessionsAttemptedPromise = new Promise(resolve => {
        allSessionsAttemptedResolve = resolve;
      });
      const flagSessionAttempted = () => {
        sessionsAttempted++;
        if (sessionsAttempted === sessions.length) {
          allSessionsAttemptedResolve();
        }
      };
      const originalGenerateDbUuid = models.SyncSession.generateDbUuid.bind(models.SyncSession);
      const generateDbUuidSpy = jest
        .spyOn(models.SyncSession, 'generateDbUuid')
        .mockImplementation(async () => {
          flagSessionAttempted();
          await allSessionsAttemptedPromise; // Don't actually create a sync session until all 3 have been attempted
          return originalGenerateDbUuid();
        });
      try {
        const results = await Promise.all(
          sessions.map(async (device, index) => {
            await sleepAsync(10 + index * 500);
            const result = await requestSyncUnchecked(device);
            flagSessionAttempted(); // If request has completed, we need to flag that we've attempted the session
            return result;
          }),
        );

        const goodToGoCount = results.filter(r => r.body?.status === 'goodToGo').length;
        expect(goodToGoCount).toEqual(MAX_CONCURRENT_SESSIONS);

        const activeCount = await models.SyncSession.count({
          where: {
            completedAt: { [Op.is]: null },
            errors: { [Op.is]: null },
          },
        });
        expect(activeCount).toEqual(MAX_CONCURRENT_SESSIONS);
      } finally {
        generateDbUuidSpy.mockRestore();
      }
    });
  }),
);
