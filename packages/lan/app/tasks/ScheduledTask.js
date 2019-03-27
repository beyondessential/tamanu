import { scheduleJob } from 'node-schedule';

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
      console.log('Scheduled', name);
      this.job = scheduleJob(this.schedule, () => {
        console.log('Running', name);
        this.run();
      });
    }
  }

  cancelPolling() {
    if (this.job) {
      this.job.cancel();
      this.job = null;
      console.log('Cancelled', this.getName());
    }
  }
}
