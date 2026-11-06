import config from 'config';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  COMMUNICATION_STATUSES,
  PATIENT_COMMUNICATION_CHANNELS,
  REPORT_REQUEST_STATUSES,
} from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

import { CentralSyncManager } from '../../app/sync/CentralSyncManager';
import { createTestContext } from '../utilities';

const SUPERVISOR_TOKEN = 'test-supervisor-token';

describe('Supervisor routes', () => {
  let ctx;
  let models;
  let baseApp;
  let originalSupervisorConfig;

  const withToken = (request, token = SUPERVISOR_TOKEN) =>
    request.set('Authorization', `Bearer ${token}`);
  const refreshLookup = () => withToken(baseApp.post('/api/supervisor/lookup-refresh'));
  const busy = () => withToken(baseApp.get('/api/supervisor/busy'));

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;
    originalSupervisorConfig = config.supervisor;
  });

  beforeEach(() => {
    config.supervisor = { token: SUPERVISOR_TOKEN };
  });

  afterEach(() => {
    config.supervisor = originalSupervisorConfig;
    vi.restoreAllMocks();
  });

  afterAll(() => ctx.close());

  describe('credential', () => {
    const routes = [
      ['post', '/api/supervisor/lookup-refresh'],
      ['get', '/api/supervisor/busy'],
    ];

    it.each(routes)('%s %s rejects a request with no credential', async (method, path) => {
      const response = await baseApp[method](path);
      expect(response.status).toBe(401);
    });

    it.each(routes)('%s %s rejects the wrong credential', async (method, path) => {
      const response = await withToken(baseApp[method](path), 'not-the-token');
      expect(response.status).toBe(401);
    });

    it.each(routes)(
      '%s %s rejects a credential that is not a bearer token',
      async (method, path) => {
        const response = await baseApp[method](path).set('Authorization', SUPERVISOR_TOKEN);
        expect(response.status).toBe(401);
      },
    );

    it.each(routes)('%s %s rejects a user access token', async (method, path) => {
      const agent = await baseApp.asRole('admin');
      const response = await agent[method](path);
      expect(response.status).toBe(401);
    });

    it.each([null, '', undefined])(
      'rejects everything, even an empty credential, when the token is %j',
      async unsetToken => {
        config.supervisor = { token: unsetToken };
        for (const [method, path] of routes) {
          expect((await baseApp[method](path)).status).toBe(401);
          expect((await baseApp[method](path).set('Authorization', 'Bearer ')).status).toBe(401);
          expect((await withToken(baseApp[method](path), '')).status).toBe(401);
          expect((await withToken(baseApp[method](path), 'null')).status).toBe(401);
        }
      },
    );

    it('rejects everything when the supervisor config is missing', async () => {
      config.supervisor = undefined;
      expect((await busy()).status).toBe(401);
    });
  });

  describe('GET /api/supervisor/busy', () => {
    beforeEach(async () => {
      await models.ReportRequest.destroy({ where: {}, force: true });
      await models.PatientCommunication.destroy({ where: {}, force: true });
      await models.FhirJob.destroy({ where: {}, force: true });
    });

    it('is not busy when no queue has pending items', async () => {
      const response = await busy();
      expect(response).toHaveSucceeded();
      expect(response.body.busy).toBe(false);
      expect(Object.values(response.body.pending).every(count => count === 0)).toBe(true);
      expect(Object.keys(response.body.pending)).toEqual(
        expect.arrayContaining([
          'ReportRequestProcessor',
          'PatientEmailCommunicationProcessor',
          'PortalCommunicationProcessor',
          'PatientTelegramCommunicationProcessor',
          'CertificateNotificationProcessor',
          'IPSRequestProcessor',
          'FhirJobs',
        ]),
      );
    });

    it('is busy when a report request is waiting', async () => {
      const user = await models.User.create(fake(models.User));
      await models.ReportRequest.create(
        fake(models.ReportRequest, {
          requestedByUserId: user.id,
          status: REPORT_REQUEST_STATUSES.RECEIVED,
        }),
      );

      const response = await busy();
      expect(response.body.busy).toBe(true);
      expect(response.body.pending.ReportRequestProcessor).toBe(1);
    });

    it('is not busy for a report request that has already been dealt with', async () => {
      const user = await models.User.create(fake(models.User));
      await models.ReportRequest.create(
        fake(models.ReportRequest, {
          requestedByUserId: user.id,
          status: REPORT_REQUEST_STATUSES.PROCESSED,
        }),
      );

      expect((await busy()).body.busy).toBe(false);
    });

    it('is busy when a communication is waiting to be sent', async () => {
      await models.PatientCommunication.create(
        fake(models.PatientCommunication, {
          status: COMMUNICATION_STATUSES.QUEUED,
          channel: PATIENT_COMMUNICATION_CHANNELS.EMAIL,
          patientId: (await models.Patient.create(fake(models.Patient))).id,
        }),
      );

      const response = await busy();
      expect(response.body.busy).toBe(true);
      expect(response.body.pending.PatientEmailCommunicationProcessor).toBe(1);
      expect(response.body.pending.PatientTelegramCommunicationProcessor).toBe(0);
    });

    it('is busy when a FHIR job is queued', async () => {
      await models.FhirJob.create(fake(models.FhirJob, { status: 'Queued' }));

      const response = await busy();
      expect(response.body.busy).toBe(true);
      expect(response.body.pending.FhirJobs).toBe(1);
    });
  });

  describe('POST /api/supervisor/lookup-refresh', () => {
    it('runs a build and answers with the highest real-change tick', async () => {
      const build = vi.spyOn(CentralSyncManager.prototype, 'buildLookupTable');

      const response = await refreshLookup();

      expect(response).toHaveSucceeded();
      expect(build).toHaveBeenCalledTimes(1);
      expect(response.body).toHaveProperty('highestRealChangeTick');
      const { highestRealChangeTick } = response.body;
      expect(highestRealChangeTick === null || Number.isInteger(highestRealChangeTick)).toBe(true);
    });

    it('answers with an error, not a success, when the build aborts', async () => {
      vi.spyOn(CentralSyncManager.prototype, 'buildLookupTable').mockRejectedValue(
        new Error('Sync lookup rebuild: an underlying record was hard deleted during this build'),
      );

      const response = await refreshLookup();

      expect(response.status).toBe(500);
      expect(response.body).not.toHaveProperty('highestRealChangeTick');
    });

    it('runs again after an aborted build, because the build lock is released', async () => {
      const build = vi
        .spyOn(CentralSyncManager.prototype, 'buildLookupTable')
        .mockRejectedValueOnce(new Error('aborted'));

      expect((await refreshLookup()).status).toBe(500);
      expect(await refreshLookup()).toHaveSucceeded();
      expect(build).toHaveBeenCalledTimes(2);
    });
  });

  describe('build serialisation', () => {
    // two managers stand in for the scheduled build (tasks process) and the on-demand build (api)
    it('makes a build that is asked for while another runs wait for it, then run', async () => {
      const first = new CentralSyncManager(ctx);
      const second = new CentralSyncManager(ctx);
      const events = [];

      let finishFirstBuild;
      const firstBuildGate = new Promise(resolve => {
        finishFirstBuild = resolve;
      });
      let firstBuildStarted;
      const firstBuildHasStarted = new Promise(resolve => {
        firstBuildStarted = resolve;
      });
      vi.spyOn(first, 'buildLookupTable').mockImplementation(async () => {
        events.push('first started');
        firstBuildStarted();
        await firstBuildGate;
        events.push('first finished');
      });
      vi.spyOn(second, 'buildLookupTable').mockImplementation(async () => {
        events.push('second started');
      });

      const firstRun = first.updateLookupTable();
      await firstBuildHasStarted;
      const secondRun = second.updateLookupTable();

      // long enough for an unserialised second build to have started
      await sleepAsync(500);
      expect(events).toEqual(['first started']);

      finishFirstBuild();
      await Promise.all([firstRun, secondRun]);
      expect(events).toEqual(['first started', 'first finished', 'second started']);
    });

    it('lets a waiting build run after the build ahead of it aborts', async () => {
      const first = new CentralSyncManager(ctx);
      const second = new CentralSyncManager(ctx);

      let abortFirstBuild;
      let firstBuildStarted;
      const firstBuildHasStarted = new Promise(resolve => {
        firstBuildStarted = resolve;
      });
      vi.spyOn(first, 'buildLookupTable').mockImplementation(
        () =>
          new Promise((_resolve, reject) => {
            abortFirstBuild = () => reject(new Error('aborted'));
            firstBuildStarted();
          }),
      );
      const secondBuild = vi.spyOn(second, 'buildLookupTable').mockResolvedValue();

      const firstRun = first.updateLookupTable();
      const firstRunOutcome = expect(firstRun).rejects.toThrow('aborted');
      await firstBuildHasStarted;
      const secondRun = second.updateLookupTable();
      await sleepAsync(200);
      expect(secondBuild).not.toHaveBeenCalled();

      abortFirstBuild();
      await firstRunOutcome;
      await secondRun;
      expect(secondBuild).toHaveBeenCalledTimes(1);
    });
  });
});
