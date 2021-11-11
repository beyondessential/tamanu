import { v4 as uuid } from 'uuid';
import { scheduleJob } from 'node-schedule';

export class ScheduledTask {
  getName() {
    // Note that this.constructor.name will only work in dev,
    // but this error should only be encountered in dev
    throw new Error(`ScheduledTask::getName not overridden for ${this.constructor.name}`);
  }

  constructor(schedule, log) {
    this.schedule = schedule;
    this.job = null;
    this.log = log;
    this.currentlyRunningTask = null;
  }

  // eslint-disable-next-line class-methods-use-this
  async run() {
    throw new Error('Not implemented');
  }

  async runImmediately() {
    const name = this.getName();

    if (this.currentlyRunningTask) {
      this.log.info(`ScheduledTask: ${name}: Not running (previous task still running)`);
      return;
    }

    const runId = uuid();
    this.log.info(`ScheduledTask: ${name}: Running (id=${runId})`);
    try {
      this.currentlyRunningTask = this.run();
      await this.currentlyRunningTask;
      this.log.info(`ScheduledTask: ${name}: Succeeded (id=${runId})`);
    } catch (e) {
      this.log.error(`ScheduledTask: ${name}: Failed (id=${runId})`);
      this.log.error(e.stack);
    } finally {
      this.currentlyRunningTask = null;
    }
  }

  beginPolling() {
    if (!this.job) {
      const name = this.getName();
      this.log.info(`ScheduledTask: ${name}: Scheduled for ${this.schedule}`);
      this.job = scheduleJob(this.schedule, async () => {
        await this.runImmediately();
      });
    }
  }

  cancelPolling() {
    if (this.job) {
      this.job.cancel();
      this.job = null;
      this.log.info(`ScheduledTask: ${this.getName()}: Cancelled`);
    }
  }
}
