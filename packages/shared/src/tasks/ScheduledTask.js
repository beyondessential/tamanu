import { SpanStatusCode } from '@opentelemetry/api';
import shortid from 'shortid';
import { scheduleJob } from 'node-schedule';
import { getTracer, spanWrapFn } from '../services/logging';

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
    this.isRunning = false;
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

  async runImmediatelyImplementation(name, span) {
    for (const subtask of this.subtasks) {
      const outcome = await subtask.runImmediately();
      if (!outcome) {
        // We expect the subtask will have caught & logged all its own errors
        this.log.info(`ScheduledTask: ${name}: Not running (subtask failed)`);
        span.addEvent('Skip: subtask failed');
        return false;
      }
    }

    if (this.isRunning) {
      const durationMs = Date.now() - this.start;
      this.log.info(`ScheduledTask: ${name}: Not running (previous task still running)`, {
        durationMs,
      });
      span.addEvent('Skip: previous task still running');
      return false;
    }

    try {
      span.addEvent('checkQueue');
      // eslint-disable-next-line no-shadow
      const queueCount = await spanWrapFn('countQueue', span => this.countQueue(span));
      if (queueCount === null) {
        // Not a queue-based task (countQueue was not overridden)
      } else if (queueCount === 0) {
        // Nothing to do, don't even run
        this.log.info(`ScheduledTask: ${name}: Nothing to do`, { queueCount });
        span.addEvent('Skip: nothing to do');
        return true;
      } else {
        this.log.info(`Queue status: ${name}`, { queueCount });
        span.setAttribute('task.queueCount', queueCount);
      }
    } catch (e) {
      this.log.error(`Error counting queue: ${name}`, e);
      span.recordException(e);
      span.setStatus({ code: SpanStatusCode.ERROR });
      return false;
    }

    span.addEvent('pre-start');
    const runId = shortid();
    span.setAttribute('task.runId', runId);

    this.log.info(`ScheduledTask: ${name}: Running`, { id: runId });
    span.addEvent('start');
    this.start = Date.now();

    try {
      // eslint-disable-next-line no-shadow
      await spanWrapFn('run', async span => {
        this.isRunning = true;
        await this.run(span);
      });

      const durationMs = Date.now() - this.start;
      this.log.info(`ScheduledTask: ${name}: Succeeded`, { id: runId, durationMs });

      span.addEvent('success');
      span.setStatus({ code: SpanStatusCode.OK });

      return true;
    } catch (e) {
      const durationMs = Date.now() - this.start;
      this.log.error(`ScheduledTask: ${name}: Failed`, { id: runId, durationMs });
      this.log.error(e.stack);

      span.recordException(e);
      span.setStatus({ code: SpanStatusCode.ERROR });

      return false;
    } finally {
      this.start = null;
      this.isRunning = false;
      span.addEvent('end');
    }
  }

  async runImmediately() {
    const name = this.getName();

    return getTracer().startActiveSpan(`ScheduledTask/${name}`, { root: true }, async span => {
      span.setAttribute('code.function', name);
      try {
        span.addEvent('call');
        return await this.runImmediatelyImplementation(name, span);
      } catch (e) {
        span.recordException(e);
        span.setStatus({ code: SpanStatusCode.ERROR });
        return false;
      } finally {
        span.end();
      }
    });
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
