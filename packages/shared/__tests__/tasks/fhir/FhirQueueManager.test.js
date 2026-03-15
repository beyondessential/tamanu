import { describe, expect, it, jest } from '@jest/globals';
import { withErrorShown } from '@tamanu/shared/test-helpers';
import { FhirQueueManager } from '@tamanu/shared/tasks';
import { fakeUUID } from '@tamanu/utils/generateId';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

import { createTestContext } from '../../utilities';
import { JOB_PRIORITIES } from '@tamanu/constants';

function makeLogger(mock, topData = {}) {
  return {
    debug: (message, data = {}) => mock('debug', message, { ...topData, ...data }),
    info: (message, data = {}) => mock('info', message, { ...topData, ...data }),
    warn: (message, data = {}) => mock('warn', message, { ...topData, ...data }),
    error: (message, data = {}) => mock('error', message, { ...topData, ...data }),
    child: data => makeLogger(mock, { ...topData, ...data }),
  };
}

function testHandler(job, { log }) {
  if (job.payload.error) {
    throw new Error('testHandler: error');
  }

  log.info('testHandler: success', job.payload);
}

describe('FhirQueueManager', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext({ initFhir: true });
    models = ctx.store.models;
  });

  afterAll(() => ctx.close());

  describe('submitting a job', () => {
    it(
      'with defaults',
      withErrorShown(async () => {
        const { FhirJob: Job } = models;
        const id = await Job.submit('topic', { payload: 'value' });

        const job = await Job.findByPk(id);
        expect(job).toMatchObject({
          topic: 'topic',
          payload: { payload: 'value' },
          priority: JOB_PRIORITIES.DEFAULT,
        });
        expect(job.discriminant).toMatch(
          /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
        );
      }),
    );

    it(
      'with a priority',
      withErrorShown(async () => {
        const { FhirJob: Job } = models;
        const id = await Job.submit('topic', { payload: 'value' }, { priority: 4321 });

        const job = await Job.findByPk(id);
        expect(job).toMatchObject({
          topic: 'topic',
          payload: { payload: 'value' },
          priority: 4321,
        });
        expect(job.discriminant).toMatch(
          /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
        );
      }),
    );

    it(
      'with a discriminant',
      withErrorShown(async () => {
        const { FhirJob: Job } = models;
        const first = await Job.submit('topic', { payload: 'first' }, { discriminant: 'unique' });
        const second = await Job.submit('topic', { payload: 'second' }, { discriminant: 'unique' });

        const job = await Job.findByPk(first);
        expect(job).toMatchObject({
          topic: 'topic',
          payload: { payload: 'first' },
          priority: JOB_PRIORITIES.DEFAULT,
        });
        expect(job.discriminant).toEqual('unique');
        expect(second).toBeNull();
      }),
    );
  });

  describe('running a job', () => {
    let logger;
    let queueManager;

    beforeEach(async () => {
      logger = jest.fn();
      queueManager = new FhirQueueManager(ctx.store, ctx.settings, makeLogger(logger));
      queueManager.testMode = true;
      await queueManager.start();
      await queueManager.setHandler('test', testHandler);
    });

    afterEach(async () => {
      await queueManager.stop();
    });

    it(
      'successfully',
      withErrorShown(async () => {
        const { FhirJob: Job } = models;

        const id = await Job.submit('test');
        await queueManager.processQueue('test');

        expect(await Job.findByPk(id)).toBeNull();
      }),
    );

    it(
      'failing',
      withErrorShown(async () => {
        const { FhirJob: Job } = models;

        const id = await Job.submit('test', { error: true });
        await queueManager.processQueue('test');

        expect(await Job.findByPk(id)).toMatchObject({
          status: 'Errored',
          error: expect.any(String),
        });
      }),
    );
  });

  describe('processing the queue', () => {
    let logger;
    let queueManager;

    beforeEach(
      withErrorShown(async () => {
        await models.FhirJob.truncate();

        logger = jest.fn();
        queueManager = new FhirQueueManager(ctx.store, ctx.settings, makeLogger(logger));
        queueManager.testMode = true;
        queueManager._concurrency = 1;
        await queueManager.setHandler('test1', testHandler);
        await queueManager.setHandler('test2', testHandler);
        await queueManager.start();
      }),
    );

    afterEach(async () => {
      await queueManager.stop();
    });

    it(
      'jobs are processed by their topic',
      withErrorShown(async () => {
        const { FhirJob: Job } = models;
        const id1 = await Job.submit('test1');
        const id2 = await Job.submit('test2');

        await queueManager.processQueue('test1');

        expect(await Job.findByPk(id1)).toBeNull();
        expect(await Job.findByPk(id2)).toMatchObject({
          status: 'Queued',
        });
      }),
    );

    it(
      'jobs are processed in priority order',
      withErrorShown(async () => {
        const jobCompletionOrder = [];
        const completionOrderHandler = async job => {
          jobCompletionOrder.push(job.id);
        };
        await queueManager.setHandler('test1', completionOrderHandler);

        const { FhirJob: Job } = models;
        const id1Low = await Job.submit('test1', {}, { priority: JOB_PRIORITIES.LOW });
        const id1Normal = await Job.submit('test1');
        const id1High = await Job.submit('test1', {}, { priority: JOB_PRIORITIES.HIGH });

        await queueManager.processQueue('test1');

        expect(jobCompletionOrder).toEqual([id1High, id1Normal, id1Low]);
      }),
    );

    it(
      'a job that was never started by other worker is picked up again',
      withErrorShown(async () => {
        const { FhirJob: Job } = models;
        const id = await Job.submit('test1');
        await Job.update({ status: 'Grabbed', workerId: fakeUUID() }, { where: { id } });

        await sleepAsync(11_000);

        await queueManager.processQueue('test1');
        expect(await Job.findByPk(id)).toBeNull();
      }),
    );

    it(
      'a job that was never started by same worker is picked up again',
      withErrorShown(async () => {
        const { FhirJob: Job } = models;
        const id = await Job.submit('test1');
        await Job.update(
          { status: 'Grabbed', workerId: queueManager.worker.id },
          { where: { id } },
        );

        await sleepAsync(11_000);

        await queueManager.processQueue('test1');
        expect(await Job.findByPk(id)).toBeNull();
      }),
    );

    it(
      'a job that was dropped is picked up again',
      withErrorShown(async () => {
        const { FhirJob: Job } = models;
        const id = await Job.submit('test1');
        await Job.update({ status: 'Started', workerId: fakeUUID() }, { where: { id } });

        await queueManager.processQueue('test1');
        expect(await Job.findByPk(id)).toBeNull();
      }),
    );

    it(
      'several jobs can be grabbed simultaneously',
      withErrorShown(async () => {
        const { FhirJob: Job } = models;
        queueManager._concurrency = 10;
        await queueManager.setHandler('test3', testHandler);
        const id1 = await Job.submit('test3');
        const id2 = await Job.submit('test3');
        const id3 = await Job.submit('test3');

        await queueManager.processQueue('test3');

        expect(await Job.findByPk(id1)).toBeNull();
        expect(await Job.findByPk(id2)).toBeNull();
        expect(await Job.findByPk(id3)).toBeNull();
      }),
    );

    it(
      'slow running jobs will not block other jobs from being processed',
      withErrorShown(async () => {
        const { FhirJob: Job } = models;
        await Job.submit('slowJob', {}, { priority: JOB_PRIORITIES.HIGH });
        const fastJobs = [
          await Job.submit('fastJob'),
          await Job.submit('fastJob'),
          await Job.submit('fastJob'),
          await Job.submit('fastJob'),
          await Job.submit('fastJob'),
        ];

        let fastJobsRemaining = fastJobs.length;
        let fastJobsDoneResolve;
        const fastJobsDonePromise = new Promise(resolve => {
          fastJobsDoneResolve = resolve;
        });

        const fastJob = async () => {
          fastJobsRemaining--;
          if (fastJobsRemaining === 0) {
            fastJobsDoneResolve();
          }
        };
        await queueManager.setHandler('fastJob', fastJob);

        const slowJob = async () => {
          await fastJobsDonePromise;
        };
        await queueManager.setHandler('slowJob', slowJob);

        await Promise.all([
          queueManager.processQueue('slowJob'),
          queueManager.processQueue('fastJob'),
        ]);

        expect(await Job.count()).toBe(0);
      }),
    );
  });
});
