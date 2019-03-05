import { scheduleJob } from 'node-schedule';

export class ScheduledTask {
  
  constructor(schedule) {
    this.schedule = schedule;
    this.job = null;
  }

  async run() {
    throw new Error('Not implemented');
  }

  beginPolling() {
    console.log('Scheduled', this.constructor.name);
    this.job = scheduleJob(this.schedule, () => {
      console.log('Running', this.constructor.name);
      this.run();
    });
  }

  cancelPolling() {
    this.job.cancel();
    this.job = null;
    console.log('Cancelled', this.constructor.name);
  }
}

