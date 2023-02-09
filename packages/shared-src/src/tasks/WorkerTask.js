import { ScheduledTask } from './ScheduledTask';
import { log } from '../services/logging';

export class WorkerTask extends ScheduledTask {
  constructor(context, topic, workerId, schedule, maxConcurrency) {
    super(schedule, log);
    this.models = context.models;
    this.sequelize = context.sequelize;
    this.topic = topic;
    this.workerId = workerId;
    this.maxConcurrency = maxConcurrency;
  }

  getName() {
    return `jobs/${this.topic}`;
  }

  countQueue() {
    return this.models.Job.backlog(this.topic);
  }

  /** Actual work goes here
   * 
   * Throw an error to mark the job as errored, return normally to mark it as completed.
   * Return values will be ignored.
   * 
   * @abstract
   * @typedef { import('shared/models/Job').Job } Job
   * @param {Job} job Job model instance (for payload)
   * @returns {Promise<void>}
  */
  // eslint-disable-next-line no-unused-vars class-methods-use-this
  async doWork(job) {
    throw new Error('WorkerTask.doWork() must be implemented');
  }

  async run() {
    const count = Math.min(await this.countQueue(), this.maxConcurrency);
    if (count === 0) return;

    this.log.info('WorkerTask: Grabbing jobs', {
      workerId: this.workerId,
      topic: this.topic,
      count,
    });

    await Promise.allSettled(
      Array(count)
        .fill(0)
        .map(() => this.runOne()),
    );
  }

  async runOne() {
    const job = await this.models.Job.grab(this.workerId, this.topic);
    if (!job) return;

    try {
      this.log.info('WorkerTask: Job started', {
        workerId: this.workerId,
        topic: this.topic,
        jobId: job.id,
      });
      const start = Date.now();

      await this.doWork(job);

      await job.complete(this.workerId);
      this.log.info('WorkerTask: Job completed', {
        workerId: this.workerId,
        topic: this.topic,
        jobId: job.id,
        durationMs: Date.now() - start,
      });
    } catch (err) {
      await job.error(this.workerId, err.message);
      this.log.error('WorkerTask: Job failed', {
        workerId: this.workerId,
        topic: this.topic,
        jobId: job.id,
        error: err.message,
      });
    }
  }
}
