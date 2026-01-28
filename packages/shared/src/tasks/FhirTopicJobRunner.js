import { SpanStatusCode } from '@opentelemetry/api';
import { formatRFC3339 } from 'date-fns';

import { getTracer, spanWrapFn } from '../services/logging';
import { v4 as uuidv4 } from 'uuid';

export class FhirTopicJobRunner {
  isRunning = false;
  jobRuns = new Map();
  jobRunnerQueuePromise = null;
  jobRunnerQueueResolve = null;

  constructor(fhirWorker, topic, handler) {
    this.fhirWorker = fhirWorker;
    this.topic = topic;
    this.handler = handler;
  }

  processQueue() {
    this.isRunning = true;
    return getTracer().startActiveSpan(
      `FhirTopicJobRunner.processQueue`,
      { root: true },
      async span => {
        span.setAttributes({
          'code.function': 'processQueue',
          'job.topic': this.topic,
        });

        this.jobRunnerQueuePromise = new Promise(resolve => {
          this.jobRunnerQueueResolve = resolve;
        });

        // Start as many job runs as we have capacity
        for (let i = this.jobRuns.size; i < this.fhirWorker.runnersPerTopic(); i++) {
          this.startJobRun();
        }

        return this.jobRunnerQueuePromise;
      },
    );
  }

  startJobRun(delay = 0) {
    const id = uuidv4();
    this.jobRuns.set(
      id,
      this.grabAndRunOne(delay).finally(() => this.clearJobRun(id)),
    );
  }

  clearJobRun(id) {
    this.jobRuns.delete(id);
    if (this.jobRunnerQueuePromise && this.jobRuns.size === 0) {
      // All jobs have been cleared, resolve the promise
      this.jobRunnerQueueResolve();
      this.jobRunnerQueuePromise = null;
      this.isRunning = false;
    }
  }

  stop() {
    this.isRunning = false;
    return this.jobRunnerQueuePromise;
  }

  grabAndRunOne() {
    return getTracer().startActiveSpan(
      `FhirJobRunner/${this.topic}`,
      { root: true },
      async span => {
        span.setAttributes({
          'code.function': 'grabAndRunOne',
          'job.topic': this.topic,
          'job.worker': this.fhirWorker.worker.id,
        });

        if (!this.isRunning) {
          return; // The runner has been stopped, don't start a new one
        }

        try {
          const job = await spanWrapFn('FhirJob.grab', () =>
            this.fhirWorker.models.FhirJob.grab(this.fhirWorker.worker.id, this.topic),
          );
          if (!job) {
            // No job found, don't start a new job run
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
              await spanWrapFn('FhirJob.start', () => job.start(this.fhirWorker.worker.id));
            } catch (err) {
              throw new FhirQueueManagerError(this.topic, 'failed to mark job as started', err);
            }

            try {
              await spanWrapFn(`FhirQueueManager.handler`, childSpan =>
                this.handler(job, {
                  span: childSpan,
                  log: this.fhirWorker.log.child({ topic: this.topic, jobId: job.id }),
                  models: this.fhirWorker.models,
                  sequelize: this.fhirWorker.sequelize,
                }),
              );
            } catch (workErr) {
              try {
                await spanWrapFn('FhirJob.fail', () =>
                  job.fail(
                    this.fhirWorker.worker.id,
                    workErr.stack ?? workErr.message ?? workErr?.toString() ?? 'Unknown error',
                  ),
                );
              } catch (err) {
                throw new FhirQueueManagerError(
                  this.topic,
                  'job completed but failed to mark as errored',
                  err,
                );
              }
              throw new FhirQueueManagerError(this.topic, 'job failed', workErr);
            }

            try {
              await spanWrapFn('FhirJob.complete', () => job.complete(this.fhirWorker.worker.id));
              await this.fhirWorker.worker.recordSuccess();
            } catch (err) {
              throw new FhirQueueManagerError(
                this.topic,
                'job completed but failed to mark as complete',
                err,
              );
            }
          } catch (err) {
            await this.fhirWorker.worker.recordFailure();

            if (err instanceof FhirQueueManagerError) {
              throw err;
            }

            throw new FhirQueueManagerError(this.topic, 'error running job', err);
          }
        } catch (err) {
          span.recordException(err);
          span.setStatus({ code: SpanStatusCode.ERROR });
        } finally {
          span.end();
        }

        if (this.isRunning) {
          // immediately start a new run
          this.startJobRun();
        }
      },
    );
  }
}

class FhirQueueManagerError extends Error {
  constructor(topic, message, err = null) {
    super(
      `FhirQueueManager/${topic}: ${message}\n${err?.stack ?? err?.message ?? err?.toString() ?? ''}`,
    );
    this.name = 'FhirWorkerError';
    if (err && err instanceof Error) {
      this.stack = err.stack;
    }
  }
}
