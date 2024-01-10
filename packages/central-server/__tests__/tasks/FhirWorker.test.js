import { jest, describe, expect, it } from '@jest/globals';
import { withErrorShown } from '@tamanu/shared/test-helpers';
import { FhirWorker } from '@tamanu/shared/tasks';
import { fakeUUID } from '@tamanu/shared/utils/generateId';
import { sleepAsync } from '@tamanu/shared/utils/sleepAsync';

import { createTestContext } from '../utilities';

function makeLogger(mock, topData = {}) {
  return {
    debug: (message, data = {}) => mock('debug', message, { ...topData, ...data }),
    info: (message, data = {}) => mock('info', message, { ...topData, ...data }),
    warn: (message, data = {}) => mock('warn', message, { ...topData, ...data }),
    error: (message, data = {}) => mock('error', message, { ...topData, ...data }),
    child: data => makeLogger(mock, { ...topData, ...data }),
  };
}

function workerTest(job, { log }) {
  if (job.payload.error) {
    throw new Error('workerTest: error');
  }

  log.info('workerTest: success', job.payload);
}

describe('Worker Jobs', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });

  afterAll(() => ctx.close());

  describe('submitting a job', () => {
    it(
      'with defaults',
      withErrorShown(async () => {
        // Act
        const { FhirJob: Job } = models;
        const id = await Job.submit('topic', { payload: 'value' });

        // Assert
        const job = await Job.findByPk(id);
        expect(job).toMatchObject({
          topic: 'topic',
          payload: { payload: 'value' },
          priority: 1000,
        });
        expect(job.discriminant).toMatch(
          /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
        );
      }),
    );

    it(
      'with a priority',
      withErrorShown(async () => {
        // Act
        const { FhirJob: Job } = models;
        const id = await Job.submit('topic', { payload: 'value' }, { priority: 4321 });

        // Assert
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
        // Act
        const { FhirJob: Job } = models;
        const first = await Job.submit('topic', { payload: 'first' }, { discriminant: 'unique' });
        const second = await Job.submit('topic', { payload: 'second' }, { discriminant: 'unique' });

        // Assert
        const job = await Job.findByPk(first);
        expect(job).toMatchObject({
          topic: 'topic',
          payload: { payload: 'first' },
          priority: 1000,
        });
        expect(job.discriminant).toEqual('unique');
        expect(second).toBeNull();
      }),
    );
  });

  describe('running a job', () => {
    let logger;
    let worker;

    beforeEach(async () => {
      logger = jest.fn();
      worker = new FhirWorker(ctx.store, makeLogger(logger));
      worker.testMode = true;
      await worker.start();
      await worker.setHandler('test', workerTest);
    });

    afterEach(async () => {
      await worker.stop();
    });

    it(
      'successfully',
      withErrorShown(async () => {
        const { FhirJob: Job } = models;

        // Act
        const id = await Job.submit('test');
        await worker.grabAndRunOne('test');

        // Assert
        expect(await Job.findByPk(id)).toBeNull();
      }),
    );

    it(
      'failing',
      withErrorShown(async () => {
        const { FhirJob: Job } = models;

        // Act
        const id = await Job.submit('test', { error: true });
        await worker.grabAndRunOne('test');

        // Assert
        expect(await Job.findByPk(id)).toMatchObject({
          status: 'Errored',
          error: expect.any(String),
        });
      }),
    );
  });

  describe('processing the queue', () => {
    let logger;
    let worker;

    beforeEach(
      withErrorShown(async () => {
        await models.FhirJob.truncate();

        logger = jest.fn();
        worker = new FhirWorker(ctx.store, makeLogger(logger));
        worker.testMode = true;
        worker.config.concurrency = 1;
        await worker.start();
        await worker.setHandler('test1', workerTest);
        await worker.setHandler('test2', workerTest);
      }),
    );

    afterEach(async () => {
      await worker.stop();
    });

    it(
      'jobs are processed by their topic',
      withErrorShown(async () => {
        const { FhirJob: Job } = models;
        const id1 = await Job.submit('test1');
        const id2 = await Job.submit('test2');

        // Act 1
        await worker.grabAndRunOne('test1');
        expect(await Job.findByPk(id1)).toBeNull();
        expect(await Job.findByPk(id2)).toMatchObject({ status: 'Queued' });

        // Act 2
        await worker.grabAndRunOne('test2');
        expect(await Job.findByPk(id2)).toBeNull();
      }),
    );

    it(
      'jobs are processed in priority order',
      withErrorShown(async () => {
        const { FhirJob: Job } = models;
        const id1Low = await Job.submit('test1', {}, { priority: 500 });
        const id1Normal = await Job.submit('test1');
        const id1High = await Job.submit('test1', {}, { priority: 5000 });
        const id2Low = await Job.submit('test2', {}, { priority: 500 });
        const id2Normal = await Job.submit('test2');
        const id2High = await Job.submit('test2', {}, { priority: 5000 });

        // Act 1 (high)
        await worker.grabAndRunOne('test1');
        expect(await Job.findByPk(id1High)).toBeNull();
        expect(await Job.findByPk(id1Normal)).toMatchObject({ status: 'Queued' });
        expect(await Job.findByPk(id1Low)).toMatchObject({ status: 'Queued' });

        expect(await Job.findByPk(id2High)).toMatchObject({ status: 'Queued' });
        expect(await Job.findByPk(id2Normal)).toMatchObject({ status: 'Queued' });
        expect(await Job.findByPk(id2Low)).toMatchObject({ status: 'Queued' });

        // Act 1 (normal)
        await worker.grabAndRunOne('test1');
        expect(await Job.findByPk(id1Normal)).toBeNull();
        expect(await Job.findByPk(id1Low)).toMatchObject({ status: 'Queued' });

        expect(await Job.findByPk(id2High)).toMatchObject({ status: 'Queued' });
        expect(await Job.findByPk(id2Normal)).toMatchObject({ status: 'Queued' });
        expect(await Job.findByPk(id2Low)).toMatchObject({ status: 'Queued' });

        // Act 2 (high)
        await worker.grabAndRunOne('test2');
        expect(await Job.findByPk(id2High)).toBeNull();
        expect(await Job.findByPk(id2Normal)).toMatchObject({ status: 'Queued' });
        expect(await Job.findByPk(id2Low)).toMatchObject({ status: 'Queued' });

        expect(await Job.findByPk(id1Low)).toMatchObject({ status: 'Queued' });
      }),
    );

    it(
      'a job that was never started by other worker is picked up again',
      withErrorShown(async () => {
        const { FhirJob: Job } = models;
        const id = await Job.submit('test1');
        await Job.update({ status: 'Grabbed', workerId: fakeUUID() }, { where: { id } });

        // Act
        await sleepAsync(11_000); // jobs must be started within 10 seconds or they are dropped

        // Assert
        await worker.grabAndRunOne('test1');
        expect(await Job.findByPk(id)).toBeNull();
      }),
    );

    it(
      'a job that was never started by same worker is picked up again',
      withErrorShown(async () => {
        const { FhirJob: Job } = models;
        const id = await Job.submit('test1');
        await Job.update({ status: 'Grabbed', workerId: worker.worker.id }, { where: { id } });

        // Act
        await sleepAsync(11_000); // jobs must be started within 10 seconds or they are dropped

        // Assert
        await worker.grabAndRunOne('test1');
        expect(await Job.findByPk(id)).toBeNull();
      }),
    );

    it(
      'a job that was dropped is picked up again',
      withErrorShown(async () => {
        const { FhirJob: Job } = models;
        const id = await Job.submit('test1');
        await Job.update({ status: 'Started', workerId: fakeUUID() }, { where: { id } });

        // Assert
        await worker.grabAndRunOne('test1');
        expect(await Job.findByPk(id)).toBeNull();
      }),
    );

    it(
      'keeps track of capacity',
      withErrorShown(() => {
        worker.config.concurrency = 5;

        expect(worker.processing.size).toBe(0);
        expect(worker.totalCapacity()).toBe(5);
        expect(worker.topicCapacity()).toBe(2);

        worker.processing.add('job1');
        worker.processing.add('job2');
        expect(worker.processing.size).toBe(2);
        expect(worker.totalCapacity()).toBe(3);
        expect(worker.topicCapacity()).toBe(1);

        worker.processing.add('job3');
        worker.processing.add('job4');
        expect(worker.processing.size).toBe(4);
        expect(worker.totalCapacity()).toBe(1);
        expect(worker.topicCapacity()).toBe(1);

        worker.processing.add('job5');
        expect(worker.totalCapacity()).toBe(0);
        expect(worker.topicCapacity()).toBe(0);
      }),
    );

    it(
      'several jobs can be grabbed simultaneously',
      withErrorShown(async () => {
        const { FhirJob: Job } = models;
        worker.config.concurrency = 10;
        await worker.setHandler('test3', workerTest);
        const id1 = await Job.submit('test3');
        const id2 = await Job.submit('test3');
        const id3 = await Job.submit('test3');

        // Act 1 (high)
        await worker.processQueue();
        // try twice just in case
        await worker.processQueue();
        // but not three times as that would ruin the test

        // Assert
        expect(await Job.findByPk(id1)).toBeNull();
        expect(await Job.findByPk(id2)).toBeNull();
        expect(await Job.findByPk(id3)).toBeNull();
      }),
    );
  });
});
