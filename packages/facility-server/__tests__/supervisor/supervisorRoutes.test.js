import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { JOB_QUEUE_STATUSES, JOB_TOPICS } from '@tamanu/constants';
import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';

import { version } from '../../app/serverInfo';
import { createTestContext } from '../utilities';

const SUPERVISOR_TOKEN = 'test-supervisor-token';

class TestTask extends ScheduledTask {
  constructor(name, runner = () => {}) {
    super(null, log);
    this.name = name;
    this.runner = runner;
  }

  getName() {
    return this.name;
  }

  async run() {
    return this.runner();
  }
}

describe('Supervisor routes', () => {
  let ctx;
  let models;
  let baseApp;

  const withToken = (request, token = SUPERVISOR_TOKEN) =>
    request.set('Authorization', `Bearer ${token}`);
  const hold = () => withToken(baseApp.post('/api/supervisor/hold'));
  const finalSync = () => withToken(baseApp.post('/api/supervisor/final-sync'));

  const recordedTask = (name, runner) => {
    const task = new TestTask(name, runner);
    task.recordRunsIn(models.ScheduledTaskState);
    return task;
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
  });

  beforeEach(async () => {
    vi.stubEnv('SUPERVISOR_TOKEN', SUPERVISOR_TOKEN);
    await models.ScheduledTaskState.releaseHold();
    await models.ScheduledTaskState.destroy({ where: {}, force: true });
    await models.FhirJob.destroy({ where: {}, force: true });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  afterAll(() => ctx.close());

  describe('credential', () => {
    const routes = [
      ['post', '/api/supervisor/hold'],
      ['delete', '/api/supervisor/hold'],
      ['get', '/api/supervisor/status'],
      ['post', '/api/supervisor/final-sync'],
    ];

    beforeEach(() => {
      vi.spyOn(ctx.syncConnection, 'runSync').mockResolvedValue({ enabled: true, ran: true });
    });

    it.each(routes)('%s %s rejects a request with no credential', async (method, path) => {
      const response = await baseApp[method](path);
      expect(response.status).toBe(401);
    });

    it.each(routes)('%s %s rejects the wrong credential', async (method, path) => {
      const response = await withToken(baseApp[method](path), 'not-the-token');
      expect(response.status).toBe(401);
    });

    it.each(routes)('%s %s rejects a user access token', async (method, path) => {
      const agent = await baseApp.asRole('admin');
      const response = await agent[method](path);
      expect(response.status).toBe(401);
    });

    it.each(routes)('%s %s accepts the supervisor credential', async (method, path) => {
      const response = await withToken(baseApp[method](path));
      expect(response).toHaveSucceeded();
    });

    it.each([undefined, ''])('rejects everything when the token is %j', async unsetToken => {
      vi.stubEnv('SUPERVISOR_TOKEN', unsetToken);
      for (const [method, path] of routes) {
        expect((await baseApp[method](path)).status).toBe(401);
        expect((await withToken(baseApp[method](path), '')).status).toBe(401);
      }
      expect(ctx.syncConnection.runSync).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/supervisor/status', () => {
    it('answers the release the server runs', async () => {
      const response = await withToken(baseApp.get('/api/supervisor/status'));
      expect(response).toHaveSucceeded();
      expect(response.body).toEqual({ version });
    });
  });

  describe('POST /api/supervisor/hold', () => {
    it('holds scheduled tasks when nothing is running', async () => {
      expect((await hold()).body).toEqual({ busy: false });

      let hasRun = false;
      expect(await recordedTask('HeldTask', () => (hasRun = true)).runImmediately()).toBe(false);
      expect(hasRun).toBe(false);
    });

    it('is busy while a scheduled task is running, and leaves no hold', async () => {
      await models.ScheduledTaskState.create({ name: 'SyncTask', runningSince: new Date() });

      expect((await hold()).body).toEqual({ busy: true, runningTasks: ['SyncTask'], fhirJobs: 0 });
      expect(await recordedTask('OtherTask').runImmediately()).toBe(true);
    });

    it('is busy with a queued FHIR job', async () => {
      await models.FhirJob.create({
        topic: JOB_TOPICS.FHIR.REFRESH.FROM_UPSTREAM,
        status: JOB_QUEUE_STATUSES.QUEUED,
      });

      expect((await hold()).body).toEqual({ busy: true, runningTasks: [], fhirJobs: 1 });
    });
  });

  describe('DELETE /api/supervisor/hold', () => {
    it('releases the hold', async () => {
      await hold();
      expect((await withToken(baseApp.delete('/api/supervisor/hold'))).status).toBe(204);
      expect(await recordedTask('ReleasedTask').runImmediately()).toBe(true);
    });
  });

  describe('POST /api/supervisor/final-sync', () => {
    it('runs an urgent sync through the sync process', async () => {
      vi.spyOn(ctx.syncConnection, 'runSync').mockResolvedValue({
        enabled: true,
        queued: false,
        ran: true,
      });

      const response = await finalSync();

      expect(response).toHaveSucceeded();
      expect(response.body).toEqual({ completed: true });
      expect(ctx.syncConnection.runSync).toHaveBeenCalledWith({ urgent: true, type: 'finalSync' });
    });

    it.each([
      ['central queued it', { enabled: true, queued: true, ran: false }],
      ['sync is disabled', { enabled: false }],
    ])('is not completed when %s', async (_, result) => {
      vi.spyOn(ctx.syncConnection, 'runSync').mockResolvedValue(result);

      const response = await finalSync();

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ completed: false, reason: expect.any(String) });
    });

    it('is not completed when the sync fails', async () => {
      vi.spyOn(ctx.syncConnection, 'runSync').mockRejectedValue(
        new Error('Could not reach the central server'),
      );

      const response = await finalSync();

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        completed: false,
        reason: 'Could not reach the central server',
      });
    });
  });
});
