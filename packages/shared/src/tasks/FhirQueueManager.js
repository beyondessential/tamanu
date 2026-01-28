import { SpanStatusCode } from '@opentelemetry/api';
import theConfig from 'config';
import ms from 'ms';
import { hostname } from 'os';

import { getTracer } from '../services/logging';
import { FhirTopicQueueProcessor } from './FhirTopicQueueProcessor';

export class FhirQueueManager {
  queueProcessors = new Map();

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
      this.log.info('FhirQueueManager: disabled');
      return;
    }

    const heartbeatInterval = await Setting.get('fhir.worker.heartbeat');
    this.log.debug('FhirQueueManager: got raw heartbeat interval', { heartbeatInterval });
    const heartbeat = Math.round(ms(heartbeatInterval) * (1 + Math.random() * 0.2 - 0.1)); // +/- 10%
    this.log.debug('FhirQueueManager: added some jitter to the heartbeat', { heartbeat });

    this.worker = await FhirJobWorker.register({
      version: 'unknown',
      serverType: 'unknown',
      hostname: hostname(),
      ...(global.serverInfo ?? {}),
    });
    this.log.info('FhirQueueManager: registered', { workerId: this.worker?.id });

    this.log.debug('FhirQueueManager: scheduling heartbeat', { intervalMs: heartbeat });
    this.heartbeat = setInterval(async () => {
      try {
        await this.worker.reload();
        this.log.info('FhirQueueManager: heartbeat:', {
          topics: this.worker.metadata.topics,
          successfulJobs: this.worker.metadata.successfulJobs || 0,
          failedJobs: this.worker.metadata.failedJobs || 0,
          totalJobs: this.worker.metadata.totalJobs || 0,
        });
        await this.worker.heartbeat();
      } catch (err) {
        this.log.error('FhirQueueManager: heartbeat failed', { err });
      }
    }, heartbeat).unref();

    this.log.debug('FhirQueueManager: listen for postgres notifications');
    this.pg = await this.sequelize.connectionManager.getConnection();
    this.pg.on('notification', msg => {
      if (msg.channel === 'jobs') {
        const { topic } = JSON.parse(msg.payload);
        this.log.debug('FhirQueueManager: got postgres notification', msg);
        this.processQueueNow(topic);
      }
    });
    this.pg.query('LISTEN jobs');
  }

  async setHandler(topic, handler) {
    this.log.info('FhirQueueManager: setting topic handler', { topic });
    await this.worker?.markAsHandling(topic);

    const existingQueueProcessor = this.queueProcessors.get(topic);
    if (existingQueueProcessor) {
      existingQueueProcessor.stop(); // No need to await, let it gracefully stop all current jobs in the background
    }

    this.queueProcessors.set(topic, new FhirTopicQueueProcessor(this, topic, handler));
  }

  async stop() {
    clearInterval(this.heartbeat);
    this.heartbeat = null;

    this.log.info('FhirQueueManager: removing all queue processors');

    await Promise.all(Array.from(this.queueProcessors.values()).map(runner => runner.stop()));
    this.queueProcessors.clear();

    await this.worker?.deregister();
    this.worker = null;

    if (this.pg) {
      this.log.info('FhirQueueManager: removing postgres notification listener');
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

  /**
   * How many concurrent jobs can be processed for a topic.
   *
   * This is calculated to evenly distribute the capacity among the topics.
   * Every topic can run at least 1 job (regardless of total capacity), and the remaining capacity
   * is divided evenly among the topics.
   *
   * @returns {number} Amount of jobs to run in parallel for a topic.
   */
  parallelisationPerTopic() {
    return Math.max(
      this.totalCapacity() > 0 ? 1 : 0, // return at least 1 if there's any capacity
      Math.floor(this.totalCapacity() / this.queueProcessors.size), // otherwise divide the capacity evenly among the topics
    );
  }

  processQueueNow(topic) {
    if (this.testMode) return;

    // using allSettled to avoid 'uncaught promise rejection' errors
    // and setImmediate to avoid growing the stack
    setImmediate(() => Promise.allSettled([this.processQueue(topic)])).unref();
  }

  processQueue(topic) {
    // start a new root span here to avoid tying this to any callers
    return getTracer().startActiveSpan(
      `FhirQueueManager.processQueue`,
      { root: true },
      async span => {
        this.log.debug(`Starting to process the queue from worker ${this.worker.id}.`);
        span.setAttributes({
          'code.function': 'processQueue',
          'job.worker': this.worker.id,
          'job.topic': topic,
        });

        try {
          if (this.totalCapacity() === 0) {
            this.log.debug('FhirQueueManager: no capacity');
            return;
          }

          const queueProcessor = this.queueProcessors.get(topic);
          if (!queueProcessor) {
            this.log.debug('FhirQueueManager: no processor for topic', { topic });
            return;
          }

          await this.queueProcessors.get(topic).processQueue();
        } catch (err) {
          this.log.debug('Trouble retrieving the backlog');
          span.recordException(err);
          span.setStatus({ code: SpanStatusCode.ERROR });
          throw err;
        } finally {
          span.end();
        }
      },
    );
  }
}
