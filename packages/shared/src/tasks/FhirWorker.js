import { SpanStatusCode } from '@opentelemetry/api';
import theConfig from 'config';
import ms from 'ms';
import { hostname } from 'os';

import { getTracer } from '../services/logging';
import { FhirJobRunner } from './FhirJobRunner';

export class FhirWorker {
  handlers = new Map();

  heartbeat = null;

  worker = null;

  config = theConfig.integrations.fhir.worker;

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
        await this.worker.reload();
        this.log.info('FhirWorker: heartbeat:', {
          topics: this.worker.metadata.topics,
          successfulJobs: this.worker.metadata.successfulJobs || 0,
          failedJobs: this.worker.metadata.failedJobs || 0,
          totalJobs: this.worker.metadata.totalJobs || 0,
        });
        await this.worker.heartbeat();
      } catch (err) {
        this.log.error('FhirWorker: heartbeat failed', { err });
      }
    }, heartbeat).unref();

    this.log.debug('FhirWorker: listen for postgres notifications');
    this.pg = await this.sequelize.connectionManager.getConnection();
    this.pg.on('notification', msg => {
      if (msg.channel === 'jobs') {
        this.log.debug('FhirWorker: got postgres notification', msg);
        this.processQueueNow();
      }
    });
    this.pg.query('LISTEN jobs');
  }

  async setHandler(topic, handler) {
    this.log.info('FhirWorker: setting topic handler', { topic });
    await this.worker?.markAsHandling(topic);
    this.handlers.set(topic, handler);
  }

  async stop() {
    clearInterval(this.heartbeat);
    this.heartbeat = null;

    this.log.info('FhirWorker: removing all topic handlers');
    this.handlers.clear();

    await this.worker?.deregister();
    await this.jobRunner?.stop();
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
    return Math.max(0, this.config.concurrency);
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

        this.jobRunner = new FhirJobRunner(
          this.models,
          this.sequelize,
          this.log,
          this.worker,
          this.totalCapacity(),
          this.handlers,
        );
        if (this.testMode) {
          this.jobRunner.retryOnEmptyQueue = false;
        }
        await this.jobRunner.start();
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
}
