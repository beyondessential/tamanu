import { SpanStatusCode } from '@opentelemetry/api';
import { formatRFC3339 } from 'date-fns';

import { getTracer, spanWrapFn } from '../services/logging';
import { sleepAsync } from '@tamanu/utils/sleepAsync';
import { v4 as uuidv4 } from 'uuid';

const MAX_GRAB_RETRY = 5000;
const INITIAL_GRAB_DELAY = 5;

export class FhirJobRunner {
  retryOnEmptyQueue = true;
  isRunning = false;
  jobRuns = new Map();
  jobRunnerQueuePromise = null;
  jobRunnerQueueResolve = null;

  constructor(models, sequelize, log, worker, totalCapacity, handlers) {
    this.models = models;
    this.sequelize = sequelize;
    this.log = log;
    this.worker = worker;
    this.totalCapacity = totalCapacity;
    this.handlers = handlers;
  }

  start() {
    this.isRunning = true;
    return getTracer().startActiveSpan(`FhirJobRunner`, { root: true }, async span => {
      span.setAttributes({
        'code.function': 'start',
      });

      this.jobRunnerQueuePromise = new Promise(resolve => {
        this.jobRunnerQueueResolve = resolve;
      });
      for (const topic of this.handlers.keys()) {
        const capacity = this.topicCapacity();
        for (let i = 0; i < capacity; i++) {
          this.startJobRun(topic);
        }
      }

      return this.jobRunnerQueuePromise;
    });
  }

  startJobRun(topic, delay = 0) {
    const id = uuidv4();
    this.jobRuns.set(
      id,
      this.grabAndRunOne(topic, delay).finally(() => this.clearJobRun(id)),
    );
  }

  clearJobRun(id) {
    this.jobRuns.delete(id);
    if (this.jobRunnerQueuePromise && this.jobRuns.size === 0) {
      // All jobs have been cleared, resolve the promise
      this.jobRunnerQueueResolve();
      this.jobRunnerQueuePromise = null;
    }
  }

  stop() {
    this.isRunning = false;
    return this.jobRunnerQueuePromise;
  }

  /**
   * How many jobs can be grabbed for a topic.
   *
   * This is calculated from the number of jobs that are processing, the total
   * allowed concurrency (from config), and the amount of handlers (for fairness).
   *
   * @returns {number} Amount of jobs to grab for a topic.
   */
  topicCapacity() {
    return Math.max(
      this.totalCapacity > 0 ? 1 : 0, // return at least 1 if there's any capacity
      Math.floor(this.totalCapacity / this.handlers.size), // otherwise divide the capacity evenly among the topics
    );
  }

  grabAndRunOne(topic, delay = 0) {
    return getTracer().startActiveSpan(`FhirJobRunner/${topic}`, { root: true }, async span => {
      span.setAttributes({
        'code.function': topic,
        'job.topic': topic,
        'job.worker': this.worker.id,
      });

      if (!this.isRunning) {
        return; // The runner has been stopped, don't start a new one
      }

      try {
        const handler = this.handlers.get(topic);
        if (!handler) {
          throw new FhirWorkerError(topic, 'no handler for topic');
        }

        const job = await spanWrapFn('FhirJob.grab', () =>
          this.models.FhirJob.grab(this.worker.id, topic),
        );
        if (!job) {
          if (this.isRunning && this.retryOnEmptyQueue) {
            // No job found, sleep then start a new job and clear this one
            await sleepAsync(delay);
            const nextDelay = Math.min(delay * 2, MAX_GRAB_RETRY) || INITIAL_GRAB_DELAY;
            this.startJobRun(topic, nextDelay);
          }
          return;
        }

        try {
          span.setAttributes({
            'job.created_at': job.createdAt,
            'job.discriminant': job.discriminant,
            'job.id': job.id,
            'job.priority': job.priority,
            'job.submitted': formatRFC3339(job.createdAt),
          });
          if (process.env.NODE_ENV !== 'production') {
            span.setAttribute('job.payload', JSON.stringify(job.payload));
          }

          try {
            await spanWrapFn('FhirJob.start', () => job.start(this.worker.id));
          } catch (err) {
            throw new FhirWorkerError(topic, 'failed to mark job as started', err);
          }

          try {
            await spanWrapFn(`FhirWorker.handler`, childSpan =>
              handler(job, {
                span: childSpan,
                log: this.log.child({ topic, jobId: job.id }),
                models: this.models,
                sequelize: this.sequelize,
              }),
            );
          } catch (workErr) {
            try {
              await spanWrapFn('FhirJob.fail', () =>
                job.fail(
                  this.worker.id,
                  workErr.stack ?? workErr.message ?? workErr?.toString() ?? 'Unknown error',
                ),
              );
            } catch (err) {
              throw new FhirWorkerError(topic, 'job completed but failed to mark as errored', err);
            }
            throw new FhirWorkerError(topic, 'job failed', workErr);
          }

          try {
            await spanWrapFn('FhirJob.complete', () => job.complete(this.worker.id));
            await this.worker.recordSuccess();
          } catch (err) {
            throw new FhirWorkerError(topic, 'job completed but failed to mark as complete', err);
          }
        } catch (err) {
          await this.worker.recordFailure();

          if (err instanceof FhirWorkerError) {
            throw err;
          }

          throw new FhirWorkerError(topic, 'error running job', err);
        }
      } catch (err) {
        span.recordException(err);
        span.setStatus({ code: SpanStatusCode.ERROR });
      } finally {
        span.end();
      }

      if (this.isRunning) {
        // immediately start a new run
        this.startJobRun(topic);
      }
    });
  }
}

class FhirWorkerError extends Error {
  constructor(topic, message, err = null) {
    super(
      `FhirWorker/${topic}: ${message}\n${err?.stack ?? err?.message ?? err?.toString() ?? ''}`,
    );
    this.name = 'FhirWorkerError';
    if (err && err instanceof Error) {
      this.stack = err.stack;
    }
  }
}
