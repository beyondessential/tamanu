import { scheduleJob } from 'node-schedule';

export class ScheduledTask {
  getName() {
    // get class name from reflection
    return this.constructor.name;
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

  beginPolling() {
    if (!this.job) {
      const name = this.getName();
      this.log.info(`Scheduled ${name} for ${this.schedule}`);
      this.job = scheduleJob(this.schedule, async () => {
        if(this.currentlyRunningTask) {
          this.log.info(`Not running ${name} (previous task still running)`);
          return;
        }

        this.log.info(`Running ${name}`);
        this.currentlyRunningTask = this.run();
        await this.currentlyRunningTask;
        this.currentlyRunningTask = null;
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
