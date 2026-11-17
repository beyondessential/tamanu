import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { JOB_QUEUE_STATUSES, JOB_TOPICS, SETTINGS_SCOPES } from '@tamanu/constants';
import { settingsCache } from '@tamanu/settings';
import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

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
  const releaseHold = () => withToken(baseApp.delete('/api/supervisor/hold'));

  const recordedTask = (name, runner) => {
    const task = new TestTask(name, runner);
    task.recordRunsIn(models.ScheduledTaskState);
    return task;
  };

  const createFhirJob = status =>
    models.FhirJob.create({ topic: JOB_TOPICS.FHIR.REFRESH.FROM_UPSTREAM, status });

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;
  });

  beforeEach(async () => {
    vi.stubEnv('SUPERVISOR_TOKEN', SUPERVISOR_TOKEN);
    await models.ScheduledTaskState.releaseHold();
    await models.ScheduledTaskState.destroy({ where: {}, force: true });
    await models.FhirJob.destroy({ where: {}, force: true });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  afterAll(() => ctx.close());

  describe('credential', () => {
    const routes = [
      ['post', '/api/supervisor/hold'],
      ['delete', '/api/supervisor/hold'],
      ['get', '/api/supervisor/status'],
    ];

    it.each(routes)('%s %s rejects a request with no credential', async (method, path) => {
      const response = await baseApp[method](path);
      expect(response.status).toBe(401);
    });

    it.each(routes)('%s %s rejects the wrong credential', async (method, path) => {
      const response = await withToken(baseApp[method](path), 'not-the-token');
      expect(response.status).toBe(401);
    });

    it.each(routes)('%s %s rejects a credential that is not a bearer token', async (method, path) => {
      const response = await baseApp[method](path).set('Authorization', SUPERVISOR_TOKEN);
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

    it.each([undefined, ''])(
      'rejects everything, even an empty credential, when the token is %j',
      async unsetToken => {
        vi.stubEnv('SUPERVISOR_TOKEN', unsetToken);
        for (const [method, path] of routes) {
          expect((await baseApp[method](path)).status).toBe(401);
          expect((await baseApp[method](path).set('Authorization', 'Bearer ')).status).toBe(401);
          expect((await withToken(baseApp[method](path), '')).status).toBe(401);
          expect((await withToken(baseApp[method](path), 'null')).status).toBe(401);
        }
      },
    );

  });

  describe('without HTTPS', () => {
    // The supervisor calls the api directly, never over TLS, so its routes answer over plain HTTP
    // even where the server requires HTTPS of everyone else.
    const setRequireHttps = async value => {
      await models.Setting.set('security.requireHttps', value, SETTINGS_SCOPES.GLOBAL);
      settingsCache.reset();
    };

    afterEach(() => setRequireHttps(false));

    it('answers the supervisor while the server requires HTTPS', async () => {
      await setRequireHttps(true);
      const agent = await baseApp.asRole('admin');
      expect(await agent.get('/api/user/me')).toBeForbidden();
      expect(await withToken(baseApp.get('/api/supervisor/status'))).toHaveSucceeded();
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
      const response = await hold();
      expect(response).toHaveSucceeded();
      expect(response.body).toEqual({ busy: false });

      let hasRun = false;
      const task = recordedTask('HeldTask', () => {
        hasRun = true;
      });
      expect(await task.runImmediately()).toBe(false);
      expect(hasRun).toBe(false);
    });

    it('is busy while a scheduled task is running, and leaves no hold', async () => {
      let finishRun;
      const runFinished = new Promise(resolve => {
        finishRun = resolve;
      });
      let markRunStarted;
      const runStarted = new Promise(resolve => {
        markRunStarted = resolve;
      });
      const running = recordedTask('RunningTask', async () => {
        markRunStarted();
        await runFinished;
      });
      const runPromise = running.runImmediately();
      await runStarted;

      const response = await hold();
      expect(response).toHaveSucceeded();
      expect(response.body).toEqual({ busy: true, runningTasks: ['RunningTask'], fhirJobs: 0 });

      // the hold was released, so another task still runs
      let hasRun = false;
      expect(await recordedTask('OtherTask', () => (hasRun = true)).runImmediately()).toBe(true);
      expect(hasRun).toBe(true);

      finishRun();
      expect(await runPromise).toBe(true);
      expect((await hold()).body).toEqual({ busy: false });
    });

    it.each([JOB_QUEUE_STATUSES.QUEUED, JOB_QUEUE_STATUSES.STARTED])(
      'is busy with a FHIR job %s',
      async status => {
        await createFhirJob(status);
        const response = await hold();
        expect(response.body).toEqual({ busy: true, runningTasks: [], fhirJobs: 1 });
      },
    );

    it.each([JOB_QUEUE_STATUSES.COMPLETED, JOB_QUEUE_STATUSES.ERRORED])(
      'is not busy with a FHIR job %s',
      async status => {
        await createFhirJob(status);
        expect((await hold()).body).toEqual({ busy: false });
      },
    );

    it('is not busy with a task that has finished', async () => {
      await recordedTask('FinishedTask').runImmediately();
      expect((await hold()).body).toEqual({ busy: false });
    });
  });

  describe('DELETE /api/supervisor/hold', () => {
    it('releases the hold', async () => {
      await hold();
      const response = await releaseHold();
      expect(response.status).toBe(204);

      let hasRun = false;
      expect(await recordedTask('ReleasedTask', () => (hasRun = true)).runImmediately()).toBe(true);
      expect(hasRun).toBe(true);
    });

    it('does nothing when there is no hold', async () => {
      expect((await releaseHold()).status).toBe(204);
      expect((await releaseHold()).status).toBe(204);
    });
  });

  describe('task run state', () => {
    it('records a run as running while it runs, then as finished', async () => {
      let stateDuringRun;
      const task = recordedTask('RecordedTask', async () => {
        stateDuringRun = await models.ScheduledTaskState.findOne({
          where: { name: 'RecordedTask' },
        });
      });

      await task.runImmediately();

      expect(stateDuringRun.runningSince).toBeInstanceOf(Date);
      expect(stateDuringRun.lastStartedAt).toBeInstanceOf(Date);
      const stateAfter = await models.ScheduledTaskState.findOne({
        where: { name: 'RecordedTask' },
      });
      expect(stateAfter.runningSince).toBeNull();
      expect(stateAfter.lastFinishedAt.getTime()).toBeGreaterThanOrEqual(
        stateAfter.lastStartedAt.getTime(),
      );
    });

    it('does not hold tasks once the hold has expired', async () => {
      await models.ScheduledTaskState.sequelize.transaction(() =>
        models.ScheduledTaskState.setHold(-1000),
      );

      let hasRun = false;
      expect(await recordedTask('LateTask', () => (hasRun = true)).runImmediately()).toBe(true);
      expect(hasRun).toBe(true);
    });

    it('clears the running state of only the named tasks', async () => {
      await models.ScheduledTaskState.bulkCreate([
        { name: 'OurTask', runningSince: new Date() },
        { name: 'TheirTask', runningSince: new Date() },
      ]);

      await models.ScheduledTaskState.clearRunning(['OurTask']);

      expect(await models.ScheduledTaskState.runningTaskNames()).toEqual(['TheirTask']);
    });
  });

  // spec: SLPWK#going-to-sleep
  // Not busy must mean nothing is running when the hold commits and nothing starts after it.
  describe('a task starting while the hold is set', () => {
    const isSettled = async promise => {
      let settled = false;
      promise.then(() => (settled = true)).catch(() => (settled = true));
      await sleepAsync(300);
      return settled;
    };

    beforeEach(async () => {
      // the hold's row exists, as it does once anything has checked it
      await models.ScheduledTaskState.startRun('Warmup');
      await models.ScheduledTaskState.finishRun('Warmup');
    });

    it('waits for a hold being set, then is held', async () => {
      let commitHold;
      const holdCommitted = new Promise(resolve => {
        commitHold = resolve;
      });
      let markHoldSet;
      const holdSet = new Promise(resolve => {
        markHoldSet = resolve;
      });
      const holding = models.ScheduledTaskState.sequelize.transaction(async () => {
        await models.ScheduledTaskState.setHold(60_000);
        markHoldSet();
        await holdCommitted;
      });
      await holdSet;

      const starting = models.ScheduledTaskState.startRun('Racer');
      // asserted once the hold commits, so a failure never leaves its transaction open
      const didStartWithoutWaiting = await isSettled(starting);

      commitHold();
      await holding;
      expect(didStartWithoutWaiting).toBe(false);
      expect(await starting).toBe(false);
    });

    it('makes the hold wait for it, then the hold is busy', async () => {
      let commitStart;
      const startCommitted = new Promise(resolve => {
        commitStart = resolve;
      });
      let markStarted;
      const started = new Promise(resolve => {
        markStarted = resolve;
      });
      // a task part way through starting its run: hold checked, run recorded, not yet committed
      const starting = models.ScheduledTaskState.sequelize.transaction(async () => {
        await models.ScheduledTaskState.lockHold('FOR SHARE');
        await models.ScheduledTaskState.create({ name: 'Racer', runningSince: new Date() });
        markStarted();
        await startCommitted;
      });
      await started;

      const holding = hold().then(response => response);
      // asserted once the start commits, so a failure never leaves its transaction open
      const didHoldWithoutWaiting = await isSettled(holding);

      commitStart();
      await starting;
      expect(didHoldWithoutWaiting).toBe(false);
      expect((await holding).body).toEqual({
        busy: true,
        runningTasks: ['Racer'],
        fhirJobs: 0,
      });
    });
  });
});
