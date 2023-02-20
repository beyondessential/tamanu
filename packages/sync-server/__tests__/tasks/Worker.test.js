import { jest, describe, expect, it } from '@jest/globals';
import { withErrorShown } from 'shared/test-helpers';
import { Worker } from 'shared/tasks';
import { createTestContext } from '../utilities';
import { WorkerTest } from '../../app/tasks/WorkerTest';
import { fakeUUID } from 'shared/utils/generateId';
import { sleepAsync } from 'shared/utils/sleepAsync';

function makeLogger(mock, topData = {}) {
  return {
    debug: (message, data = {}) => mock('debug', message, { ...topData, ...data }),
    info: (message, data = {}) => mock('info', message, { ...topData, ...data }),
    warn: (message, data = {}) => mock('warn', message, { ...topData, ...data }),
    error: (message, data = {}) => mock('error', message, { ...topData, ...data }),
    child: data => makeLogger(mock, { ...topData, ...data }),
  };
}

describe('Worker Jobs', () => {
  let ctx, models;

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
        const { Job } = models;
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
        const { Job } = models;
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
        const { Job } = models;
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
    let logger, worker;

    beforeEach(async () => {
      logger = jest.fn();
      worker = new Worker(ctx.store, makeLogger(logger));
      await worker.start();
      await worker.installTopic('test', WorkerTest);
      worker.__testingSetup();
    });

    afterEach(async () => {
      await worker.stop();
    });

    it(
      'successfully',
      withErrorShown(async () => {
        const { Job } = models;

        // Act
        const id = await Job.submit('test');
        await worker.__testingRunOnce('test');

        // Assert
        expect(await Job.findByPk(id)).toBeNull();

        const jobStarts = logger.mock.calls.filter(
          ([level, message]) => level === 'info' && message === 'WorkerTask: Job started',
        );
        expect(jobStarts).toHaveLength(1);
        expect(jobStarts[0][2]).toMatchObject({
          topic: 'test',
          workerId: worker.worker.id,
          jobId: id,
        });

        const jobCompletes = logger.mock.calls.filter(
          ([level, message]) => level === 'info' && message === 'WorkerTask: Job completed',
        );
        expect(jobCompletes).toHaveLength(1);
        expect(jobCompletes[0][2]).toMatchObject({
          topic: 'test',
          workerId: worker.worker.id,
          jobId: id,
        });
      }),
    );

    it(
      'failing',
      withErrorShown(async () => {
        const { Job } = models;

        // Act
        const id = await Job.submit('test', { error: true });
        await worker.__testingRunOnce('test');

        // Assert
        expect(await Job.findByPk(id)).toMatchObject({
          status: 'Errored',
          error: expect.any(String),
        });

        const jobStarts = logger.mock.calls.filter(
          ([level, message]) => level === 'info' && message === 'WorkerTask: Job started',
        );
        expect(jobStarts).toHaveLength(1);
        expect(jobStarts[0][2]).toMatchObject({
          topic: 'test',
          workerId: worker.worker.id,
          jobId: id,
        });

        const jobFails = logger.mock.calls.filter(
          ([level, message]) => level === 'error' && message === 'WorkerTask: Job failed',
        );
        expect(jobFails).toHaveLength(1);
        expect(jobFails[0][2]).toMatchObject({
          topic: 'test',
          workerId: worker.worker.id,
          jobId: id,
        });
      }),
    );
  });

  describe('processing the queue', () => {
    let logger, worker;

    beforeEach(async () => {
      await models.Job.truncate();
      await models.Setting.set('fhir.worker.maxConcurrency', 1);

      logger = jest.fn();
      worker = new Worker(ctx.store, makeLogger(logger));
      await worker.start();
      await worker.installTopic('test1', WorkerTest);
      await worker.installTopic('test2', WorkerTest);
      worker.__testingSetup();
    });

    afterEach(async () => {
      await worker.stop();
    });

    it(
      'jobs are processed by their topic',
      withErrorShown(async () => {
        const { Job } = models;
        const id1 = await Job.submit('test1');
        const id2 = await Job.submit('test2');

        // Act 1
        await worker.__testingRunOnce('test1');
        expect(await Job.findByPk(id1)).toBeNull();
        expect(await Job.findByPk(id2)).toMatchObject({ status: 'Queued' });

        // Act 2
        await worker.__testingRunOnce('test2');
        expect(await Job.findByPk(id2)).toBeNull();
      }),
    );

    it(
      'jobs are processed in priority order',
      withErrorShown(async () => {
        const { Job } = models;
        const id1Low = await Job.submit('test1', {}, { priority: 500 });
        const id1Normal = await Job.submit('test1');
        const id1High = await Job.submit('test1', {}, { priority: 5000 });
        const id2Low = await Job.submit('test2', {}, { priority: 500 });
        const id2Normal = await Job.submit('test2');
        const id2High = await Job.submit('test2', {}, { priority: 5000 });

        // Act 1 (high)
        await worker.__testingRunOnce('test1');
        expect(await Job.findByPk(id1High)).toBeNull();
        expect(await Job.findByPk(id1Normal)).toMatchObject({ status: 'Queued' });
        expect(await Job.findByPk(id1Low)).toMatchObject({ status: 'Queued' });

        expect(await Job.findByPk(id2High)).toMatchObject({ status: 'Queued' });
        expect(await Job.findByPk(id2Normal)).toMatchObject({ status: 'Queued' });
        expect(await Job.findByPk(id2Low)).toMatchObject({ status: 'Queued' });

        // Act 1 (normal)
        await worker.__testingRunOnce('test1');
        expect(await Job.findByPk(id1Normal)).toBeNull();
        expect(await Job.findByPk(id1Low)).toMatchObject({ status: 'Queued' });

        expect(await Job.findByPk(id2High)).toMatchObject({ status: 'Queued' });
        expect(await Job.findByPk(id2Normal)).toMatchObject({ status: 'Queued' });
        expect(await Job.findByPk(id2Low)).toMatchObject({ status: 'Queued' });

        // Act 2 (high)
        await worker.__testingRunOnce('test2');
        expect(await Job.findByPk(id2High)).toBeNull();
        expect(await Job.findByPk(id2Normal)).toMatchObject({ status: 'Queued' });
        expect(await Job.findByPk(id2Low)).toMatchObject({ status: 'Queued' });

        expect(await Job.findByPk(id1Low)).toMatchObject({ status: 'Queued' });
      }),
    );

    it(
      'a job that was never started by other worker is picked up again',
      withErrorShown(async () => {
        const { Job } = models;
        const id = await Job.submit('test1');
        await Job.update({ status: 'Grabbed', workerId: fakeUUID() }, { where: { id } });

        // Act
        await sleepAsync(11_000); // jobs must be started within 10 seconds or they are dropped

        // Assert
        await worker.__testingRunOnce('test1');
        expect(await Job.findByPk(id)).toBeNull();
      }),
    );

    it(
      'a job that was never started by same worker is picked up again',
      withErrorShown(async () => {
        const { Job } = models;
        const id = await Job.submit('test1');
        await Job.update({ status: 'Grabbed', workerId: worker.worker.id }, { where: { id } });

        // Act
        await sleepAsync(11_000); // jobs must be started within 10 seconds or they are dropped

        // Assert
        await worker.__testingRunOnce('test1');
        expect(await Job.findByPk(id)).toBeNull();
      }),
    );

    it(
      'a job that was dropped is picked up again',
      withErrorShown(async () => {
        const { Job } = models;
        const id = await Job.submit('test1');
        await Job.update({ status: 'Started', workerId: fakeUUID() }, { where: { id } });

        // Assert
        await worker.__testingRunOnce('test1');
        expect(await Job.findByPk(id)).toBeNull();
      }),
    );

    it(
      'several jobs can be grabbed simultaneously',
      withErrorShown(async () => {
        const { Job, Setting } = models;
        await Setting.set('fhir.worker.maxConcurrency', 10);
        await worker.installTopic('test3', WorkerTest);
        worker.__testingSetup();
        const id1 = await Job.submit('test3');
        const id2 = await Job.submit('test3');
        const id3 = await Job.submit('test3');

        // Act 1 (high)
        await worker.__testingRunOnce('test3');
        // try twice just in case
        await worker.__testingRunOnce('test3');
        // but not three times as that would run the test

        // Assert
        console.log(logger.mock.calls);
        expect(await Job.findByPk(id1)).toBeNull();
        expect(await Job.findByPk(id2)).toBeNull();
        expect(await Job.findByPk(id3)).toBeNull();
      }),
    );
  });
});
