import shortid from 'shortid';
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

  // eslint-disable-next-line class-methods-use-this
  async countQueue() {
    return null;
  }

  async runImmediately() {
    const name = this.getName();

    if (this.currentlyRunningTask) {
      this.log.info(`ScheduledTask: ${name}: Not running (previous task still running)`);
      return;
    }

    const count = await this.countQueue();
    if (count === null) {
      // Not a queue-based task (countQueue was not overridden)
    } else if (count === 0) {
      // Nothing to do, don't even run
      this.log.info(`ScheduledTask: ${name}: Nothing to do`);
      return;
    } else {
      this.log.info(`Queue status: ${name}`, { count });
    }

    const runId = shortid();
    this.log.info(`ScheduledTask: ${name}: Running`, { id: runId });
    const start = Date.now();
    try {
      this.currentlyRunningTask = this.run();
      await this.currentlyRunningTask;
      const durationMs = Date.now() - start;
      this.log.info(`ScheduledTask: ${name}: Succeeded`, { id: runId, durationMs });
    } catch (e) {
      const durationMs = Date.now() - start;
      this.log.error(`ScheduledTask: ${name}: Failed`, { id: runId, durationMs });
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
