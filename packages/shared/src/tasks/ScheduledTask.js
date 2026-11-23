import { SpanStatusCode } from '@opentelemetry/api';
import shortid from 'shortid';
import { scheduleJob } from 'node-schedule';
import ms from 'ms';

import { sleepAsync } from '@tamanu/utils/sleepAsync';

import { getTracer, log, spanWrapFn } from '../services/logging';

export class ScheduledTask {
  getName() {
    // Note that this.constructor.name will only work in dev,
    // but this error should only be encountered in dev
    throw new Error(`ScheduledTask::getName not overridden for ${this.constructor.name}`);
  }

  constructor(schedule, log, jitterTime, isEnabled = true) {
    log.info('Initialising scheduled task', {
      name: this.getName(),
    });

    this.schedule = schedule;
    this.job = null;
    this.log = log;
    this.isRunning = false;
    this.start = null;
    this.subtasks = [];
    this.jitterTime = jitterTime;
    this.isEnabled = isEnabled;
    this.runState = null;
    this.wasHeld = false;
  }

  /**
   * Record this task's runs, and its subtasks', in the run state, which also holds them while the
   * supervisor holds scheduled tasks.
   *
   * @param {typeof import('@tamanu/database').ScheduledTaskState} runState
   */
  recordRunsIn(runState) {
    this.runState = runState;
    for (const subtask of this.subtasks) {
      subtask.recordRunsIn(runState);
    }
  }

  /** @returns {string[]} the names of this task and its subtasks */
  getNamesWithSubtasks() {
    return [this.getName(), ...this.subtasks.flatMap(subtask => subtask.getNamesWithSubtasks())];
  }

  // spec: SLPWK#going-to-sleep
  /** A failure to record never stops a run: it goes ahead unrecorded. */
  async #startRecordedRun(name, span) {
    if (!this.runState) {
      return { isHeld: false, isRecorded: false };
    }
    try {
      const mayRun = await this.runState.startRun(name);
      return { isHeld: !mayRun, isRecorded: mayRun };
    } catch (e) {
      this.log.error(`ScheduledTask: ${name}: Failed to record the run as started`, e);
      span.addEvent('Failed to record run start');
      return { isHeld: false, isRecorded: false };
    }
  }

  async #finishRecordedRun(name, span) {
    try {
      await this.runState.finishRun(name);
    } catch (e) {
      this.log.error(`ScheduledTask: ${name}: Failed to record the run as finished`, e);
      span.addEvent('Failed to record run finish');
    }
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
    this.wasHeld = false;
    for (const subtask of this.subtasks) {
      const outcome = await subtask.runImmediately();
      if (!outcome) {
        if (subtask.wasHeld) {
          this.log.info(`ScheduledTask: ${name}: Not running (scheduled tasks are held)`);
          span.addEvent('Skip: scheduled tasks are held');
          return false;
        }
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

    // Claimed before the first await, so an overlapping call skips from here on rather than
    // starting a second run whose recorded start the first run's finish would then clear.
    this.isRunning = true;
    this.start = Date.now();
    try {
      return await this.#runClaimed(name, span);
    } finally {
      this.start = null;
      this.isRunning = false;
    }
  }

  async #runClaimed(name, span) {
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

    const { isHeld, isRecorded } = await this.#startRecordedRun(name, span);
    this.wasHeld = isHeld;
    if (isHeld) {
      this.log.info(`ScheduledTask: ${name}: Not running (scheduled tasks are held)`);
      span.addEvent('Skip: scheduled tasks are held');
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
      // before the claim is released, so a next run cannot record its start before this one's finish
      if (isRecorded) {
        await this.#finishRecordedRun(name, span);
      }
      span.addEvent('end');
    }
  }

  async runImmediately() {
    const name = this.getName();

    if (!this.isEnabled) {
      this.log.info(`ScheduledTask: ${this.getName()} is disabled, won't run immediately`);
      return true;
    }

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
    if (!this.isEnabled) {
      this.log.info(`ScheduledTask: ${this.getName()} is disabled, won't begin polling`);
      return;
    }

    if (!this.schedule) {
      this.log.error(`ScheduledTask: ${this.getName()} began polling without a schedule assigned`);
      return;
    }

    if (!this.job) {
      const name = this.getName();
      this.log.info(`ScheduledTask: ${name}: Scheduled for ${this.schedule}`);
      this.job = scheduleJob(this.schedule, async () => {
        if (this.jitterTime) {
          const randomOffset = Math.floor(Math.random() * ms(this.jitterTime));
          await sleepAsync(randomOffset);
        }

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

/**
 * Record the runs of the scheduled tasks a process runs, before any of them begins polling.
 *
 * First clears the running state left for these tasks by a previous process that stopped mid-run,
 * by name, so it leaves alone the tasks other processes run. A failure to clear is logged and left:
 * a stale running state keeps the server awake, which is the safe side.
 *
 * @param {ScheduledTask[]} tasks
 * @param {{ ScheduledTaskState: typeof import('@tamanu/database').ScheduledTaskState }} models
 */
export async function recordScheduledTaskRuns(tasks, { ScheduledTaskState }) {
  const names = tasks.flatMap(task => task.getNamesWithSubtasks());
  try {
    await ScheduledTaskState.clearRunning(names);
  } catch (e) {
    log.error('ScheduledTask: Failed to clear the running state left by a previous process', e);
  }
  for (const task of tasks) {
    task.recordRunsIn(ScheduledTaskState);
  }
}
