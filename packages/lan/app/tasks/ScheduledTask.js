import { scheduleJob } from 'node-schedule';
import { log } from '~/logging';

export class ScheduledTask {
  getName() {
    // get class name from reflection
    return this.constructor.name;
  }

  constructor(schedule) {
    this.schedule = schedule;
    this.job = null;
  }

  // eslint-disable-next-line class-methods-use-this
  async run() {
    throw new Error('Not implemented');
  }

  beginPolling() {
    if (!this.job) {
      const name = this.getName();
      log.info(`Scheduled ${name}`);
      this.job = scheduleJob(this.schedule, () => {
        log.info(`Running ${name}`);
        this.run();
      });
    }
  }

  cancelPolling() {
    if (this.job) {
      this.job.cancel();
      this.job = null;
      log.info(`Cancelled ${this.getName}`);
    }
  }
}
