import shortid from 'shortid';
import { scheduleJob } from 'node-schedule';

export class ScheduledTask {
  getName() {
    // Note that this.constructor.name will only work in dev,
    // but this error should only be encountered in dev
    throw new Error(`ScheduledTask::getName not overridden for ${this.constructor.name}`);
  }

  constructor(schedule, log) {
    log.info('Initialising scheduled task', {
      name: this.getName(),
    });

    this.schedule = schedule;
    this.job = null;
    this.log = log;
    this.currentlyRunningTask = null;
    this.start = null;
    this.subtasks = [];
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

    for (const subtask of this.subtasks) {
      const outcome = await subtask.runImmediately();
      if (!outcome) {
        // We expect the subtask will have caught & logged all its own errors
        this.log.info(`ScheduledTask: ${name}: Not running (subtask failed)`);
        return false;
      }
    }

    if (this.currentlyRunningTask) {
      const durationMs = Date.now() - this.start;
      this.log.info(`ScheduledTask: ${name}: Not running (previous task still running)`, {
        durationMs,
      });
      return false;
    }

    try {
      const queueCount = await this.countQueue();
      if (queueCount === null) {
        // Not a queue-based task (countQueue was not overridden)
      } else if (queueCount === 0) {
        // Nothing to do, don't even run
        this.log.info(`ScheduledTask: ${name}: Nothing to do`, { queueCount });
        return true;
      } else {
        this.log.info(`Queue status: ${name}`, { queueCount });
      }
    } catch (e) {
      this.log.error(`Error counting queue: ${name}`, e);
      return false;
    }

    const runId = shortid();
    this.log.info(`ScheduledTask: ${name}: Running`, { id: runId });
    this.start = Date.now();
    try {
      this.currentlyRunningTask = this.run();
      await this.currentlyRunningTask;
      const durationMs = Date.now() - this.start;
      this.log.info(`ScheduledTask: ${name}: Succeeded`, { id: runId, durationMs });
      return true;
    } catch (e) {
      const durationMs = Date.now() - this.start;
      this.log.error(`ScheduledTask: ${name}: Failed`, { id: runId, durationMs });
      this.log.error(e.stack);
      return false;
    } finally {
      this.start = null;
      this.currentlyRunningTask = null;
    }
  }

  beginPolling() {
    if (!this.schedule) {
      this.log.error(`ScheduledTask: ${this.getName()} began polling without a schedule assigned`);
      return;
    }

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
