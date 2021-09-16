import { scheduleJob } from 'node-schedule';

export class ScheduledTask {

  getName() {
    return 'Unnamed scheduled task (override getName)';
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
      this.log.info(`Not running ${name} (previous task still running)`);
      return;
    }

    this.log.info(`Running ${name}`);
    try {
      this.currentlyRunningTask = this.run();
      await this.currentlyRunningTask;
    } catch (e) {
      this.log.error(e.stack);
    } finally {
      this.currentlyRunningTask = null;
    }
  }

  beginPolling() {
    if (!this.job) {
      const name = this.getName();
      this.log.info(`Scheduled ${name} for ${this.schedule}`);
      this.job = scheduleJob(this.schedule, async () => {
        await this.runImmediately();
      });
    }
  }

  cancelPolling() {
    if (this.job) {
      this.job.cancel();
      this.job = null;
      this.log.info(`Cancelled ${this.getName}`);
    }
  }
}
