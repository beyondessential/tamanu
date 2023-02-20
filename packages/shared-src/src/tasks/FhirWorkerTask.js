import { ScheduledTask } from './ScheduledTask';

export class FhirWorkerTask extends ScheduledTask {
  constructor(context, log, topic, workerId, schedule, maxConcurrency) {
    super(schedule, log);
    this.models = context.models;
    this.sequelize = context.sequelize;
    this.topic = topic;
    this.workerId = workerId;
    this.maxConcurrency = maxConcurrency;
  }

  getName() {
    return `jobs/${this.topic ?? '(pending)'}`;
  }

  countQueue() {
    return this.models.FhirJob.backlog(this.topic);
  }

  /** Actual work goes here
   *
   * Throw an error to mark the job as errored, return normally to mark it as completed.
   * Return values will be ignored.
   *
   * @abstract
   * @typedef { import('shared/models/fhir/Job').FhirJob } FhirJob
   * @param {FhirJob} job Job model instance (for payload)
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line class-methods-use-this
  async doWork(/* job */) {
    throw new Error('WorkerTask.doWork() must be implemented');
  }

  async run() {
    this.log.debug('WorkerTask: checking queue', { topic: this.topic });
    // FIXME: this only makes sense in a single-tasks-process world
    const count = Math.min(await this.countQueue(), this.maxConcurrency);
    if (count === 0) {
      this.log.debug('WorkerTask: nothing in queue', { topic: this.topic });
      return;
    }

    this.log.info('WorkerTask: Grabbing jobs', {
      workerId: this.workerId,
      topic: this.topic,
      count,
    });

    await Promise.allSettled(
      Array(count)
        .fill(0)
        .map(async () => {
          try {
            await this.runOne();
          } catch (err) {
            this.log.error('WorkerTask: Error running job', { err, topic: this.topic });
            // eslint-disable-next-line no-console
            console.error(err);
          }
        }),
    );
  }

  async runOne() {
    this.log.debug('WorkerTask: Grabbing job', { topic: this.topic });
    const job = await this.models.FhirJob.grab(this.workerId, this.topic);
    if (!job) {
      this.log.debug('WorkerTask: No job to grab', { topic: this.topic });
      return;
    }

    this.log.debug('WorkerTask: Grabbed job', { topic: this.topic, jobId: job.id });

    try {
      await job.start(this.workerId);
      this.log.info('WorkerTask: Job started', {
        workerId: this.workerId,
        topic: this.topic,
        jobId: job.id,
      });
    } catch (err) {
      this.log.error('WorkerTask: Failed to mark job as started', { err });
      // eslint-disable-next-line no-console
      console.error(err);
      return;
    }

    const start = Date.now();

    try {
      await this.doWork(job);
    } catch (workErr) {
      try {
        await job.fail(
          this.workerId,
          workErr.stack ?? workErr.message ?? workErr?.toString() ?? 'Unknown error',
        );
        this.log.error('WorkerTask: Job failed', {
          workerId: this.workerId,
          topic: this.topic,
          jobId: job.id,
          err: workErr,
        });
      } catch (err) {
        this.log.error('WorkerTask: Job failed but failed to mark as errored', { err });
        // eslint-disable-next-line no-console
        console.error(err);
      }

      return;
    }

    try {
      await job.complete(this.workerId);
      this.log.info('WorkerTask: Job completed', {
        workerId: this.workerId,
        topic: this.topic,
        jobId: job.id,
        durationMs: Date.now() - start,
      });
    } catch (err) {
      this.log.error('WorkerTask: Job completed but failed to mark as complete', { err });
      // eslint-disable-next-line no-console
      console.error(err);
    }
  }
}
