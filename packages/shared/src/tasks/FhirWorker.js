import { SpanStatusCode } from '@opentelemetry/api';
import theConfig from 'config';
import { formatRFC3339 } from 'date-fns';
import ms from 'ms';
import { hostname } from 'os';

import { getTracer, spanWrapFn } from '../services/logging';

export class FhirWorker {
  handlers = new Map();

  heartbeat = null;

  worker = null;

  config = theConfig.integrations.fhir.worker;

  processing = new Set();

  // if false, immediately reprocess the queue after a job is completed
  // to work through the backlog promptly; this makes testing harder, so
  // in "testMode" it's disabled.
  testMode = false;

  constructor(context, log) {
    this.models = context.models;
    this.sequelize = context.sequelize;
    this.log = log;
  }

  async start() {
    const { FhirJobWorker, Setting } = this.models;
    const { enabled } = this.config;

    if (!enabled) {
      this.log.info('FhirWorker: disabled');
      return;
    }

    const heartbeatInterval = await Setting.get('fhir.worker.heartbeat');
    this.log.debug('FhirWorker: got raw heartbeat interval', { heartbeatInterval });
    const heartbeat = Math.round(ms(heartbeatInterval) * (1 + Math.random() * 0.2 - 0.1)); // +/- 10%
    this.log.debug('FhirWorker: added some jitter to the heartbeat', { heartbeat });

    this.worker = await FhirJobWorker.register({
      version: 'unknown',
      serverType: 'unknown',
      hostname: hostname(),
      ...(global.serverInfo ?? {}),
    });
    this.log.info('FhirWorker: registered', { workerId: this.worker?.id });

    this.log.debug('FhirWorker: scheduling heartbeat', { intervalMs: heartbeat });
    this.heartbeat = setInterval(async () => {
      try {
        this.log.debug('FhirWorker: heartbeat');
        await this.worker.heartbeat();
      } catch (err) {
        this.log.error('FhirWorker: heartbeat failed', { err });
      }
    }, heartbeat).unref();

    this.log.debug('FhirWorker: listen for postgres notifications');
    this.pg = await this.sequelize.connectionManager.getConnection();
    this.pg.on('notification', msg => {
      if (msg.channel === 'jobs') {
        this.log.debug('FhirWorker: got postgres notification', { msg });
        this.processQueueNow();
      }
    });
    this.pg.query('LISTEN jobs');
  }

  setHandler(topic, handler) {
    this.log.info('FhirWorker: setting topic handler', { topic });
    this.handlers.set(topic, handler);
  }

  async stop() {
    clearInterval(this.heartbeat);
    this.heartbeat = null;

    this.log.info('FhirWorker: removing all topic handlers');
    this.handlers.clear();

    await this.worker?.deregister();
    this.worker = null;

    if (this.pg) {
      this.log.info('FhirWorker: removing postgres notification listener');
      await this.sequelize.connectionManager.releaseConnection(this.pg);
      this.pg = null;
    }
  }

  /**
   * How many jobs can be grabbed.
   *
   * This is calculated from the number of jobs that are processing and the
   * total allowed concurrency (from config).
   *
   * @returns {number} Amount of jobs to grab.
   */
  totalCapacity() {
    return Math.max(0, this.config.concurrency - this.processing.size);
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
      // return at least 1 if there's any capacity
      this.totalCapacity() > 0 ? 1 : 0,
      // otherwise divide the capacity evenly among the topics
      Math.floor(this.totalCapacity() / this.handlers.size),
    );
  }

  processQueueNow() {
    if (this.testMode) return;

    // using allSettled to avoid 'uncaught promise rejection' errors
    // and setImmediate to avoid growing the stack
    setImmediate(() => Promise.allSettled([this.processQueue()])).unref();
  }

  currentlyProcessing = false;

  processQueue() {
    // start a new root span here to avoid tying this to any callers
    return getTracer().startActiveSpan(`FhirWorker.processQueue`, { root: true }, async span => {
      this.log.debug(`Starting to process the queue from worker ${this.worker.id}.`);
      span.setAttributes({
        'code.function': 'processQueue',
        'job.worker': this.worker.id,
      });

      if (this.currentlyProcessing) return;

      try {
        this.currentlyProcessing = true;
        if (this.totalCapacity() === 0) {
          this.log.debug('FhirWorker: no capacity');
          return;
        }

        span.setAttribute('job.capacity', this.totalCapacity());

        const { FhirJob } = this.models;

        const runs = [];
        for (const topic of this.handlers.keys()) {
          this.log.debug('FhirWorker: checking queue', { topic });
          const capacity = this.topicCapacity();
          const count = await FhirJob.backlogUntilLimit(topic, capacity);
          if (count === 0) {
            this.log.debug('FhirWorker: nothing in queue', { topic });
            continue;
          }

          this.log.debug('FhirWorker: grabbing some jobs', { topic, count });
          for (let i = 0; i < count; i += 1) {
            runs.push(this.grabAndRunOne(topic));
          }
        }

        await Promise.allSettled(runs);
        this.log.debug('FhirWorker: finished batch of jobs', { count: runs.length });
      } catch (err) {
        this.log.debug('Trouble retrieving the backlog');
        span.recordException(err);
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw err;
      } finally {
        this.currentlyProcessing = false;
        span.end();
      }
    });
  }

  grabAndRunOne(topic) {
    return getTracer().startActiveSpan(`FhirWorker/${topic}`, { root: true }, async span => {
      span.setAttributes({
        'code.function': topic,
        'job.topic': topic,
        'job.worker': this.worker.id,
      });

      try {
        const handler = this.handlers.get(topic);
        if (!handler) {
          throw new FhirWorkerError(topic, 'no handler for topic');
        }

        const job = await spanWrapFn('FhirJob.grab', () =>
          this.models.FhirJob.grab(this.worker.id, topic),
        );
        if (!job) {
          this.log.warn('FhirWorker: no job to grab', {
            workerId: this.worker.id,
            topic,
          });
          return;
        }

        try {
          this.processing.add(job.id);
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
          } catch (err) {
            throw new FhirWorkerError(topic, 'job completed but failed to mark as complete', err);
          }
        } catch (err) {
          if (err instanceof FhirWorkerError) {
            throw err;
          }

          throw new FhirWorkerError(topic, 'error running job', err);
        } finally {
          this.processing.delete(job.id);
        }
      } catch (err) {
        span.recordException(err);
        span.setStatus({ code: SpanStatusCode.ERROR });
      } finally {
        span.end();
        // immediately process the queue again to work through the backlog
        this.processQueueNow();
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
