import { hostname } from 'os';
import theConfig from 'config';
import ms from 'ms';

export class FhirWorker {
  handlers = new Map();

  heartbeat = null;

  worker = null;

  config = theConfig.integrations.fhir.worker;

  processing = new Set();

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
    const heartbeat = ms(heartbeatInterval);
    this.log.debug('FhirWorker: scheduling heartbeat', { intervalMs: heartbeat });

    this.worker = await FhirJobWorker.register({
      version: 'unknown',
      serverType: 'unknown',
      hostname: hostname(),
      ...(global.serverInfo ?? {}),
    });
    this.log.info('FhirWorker: registered', { workerId: this.worker?.id });

    this.heartbeat = setInterval(async () => {
      try {
        this.log.debug('FhirWorker: heartbeat');
        await this.worker.heartbeat();
      } catch (err) {
        this.log.error('FhirWorker: heartbeat failed', { err });
      }
    }, heartbeat);
  }

  async setHandler(topic, handler) {
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
  }

  /**
   * How many jobs can be grabbed.
   *
   * This is calculated from the number of jobs that are processing and the
   * total allowed concurrency (from config).
   *
   * @returns {number} Amount of jobs to grab.
   */
  async totalCapacity() {
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
  async topicCapacity() {
    return Math.floor(this.totalCapacity() / this.handlers.size);
  }

  currentlyProcessing = false;
  async processQueue() {
    if (this.currentlyProcessing) return;

    try {
      this.currentlyProcessing = true;
      if (this.totalCapacity() === 0) {
        this.log.debug('FhirWorker: no capacity');
        return;
      }

      const { FhirJob } = this.models;

      const runs = [];
      for (const topic of this.handlers.keys()) {
        this.log.debug('FhirWorker: checking queue', { topic });
        const backlog = await FhirJob.backlog(topic);
        if (backlog === 0) {
          this.log.debug('FhirWorker: nothing in queue', { topic: this.topic });
          return;
        }

        const capacity = this.topicCapacity();
        const count = Math.min(backlog, capacity);
        this.log.debug('FhirWorker: grabbing some jobs', { topic, backlog, count });
        for (let i = 0; i < count; i += 1) {
          runs.push(this.grabAndRunOne(topic));
        }
      }

      // using allSettled to avoid 'uncaught promise rejection' errors
      await Promise.allSettled(
        Array(count)
          .fill(0)
          .map(async () => {
            try {
              await this.grabAndRunOne();
            } catch (err) {
              this.log.error('FhirWorker: Error running job', { err, topic: this.topic });
              // eslint-disable-next-line no-console
              console.error(err);
            }
          }),
      );
    } finally {
      this.currentlyProcessing = false;
    }
  }

  async grabAndRunOne(topic, { testMode = false } = {}) {
    const handler = this.handlers.get(topic);
    if (!handler) {
      this.log.error('FhirWorker: no handler for topic', { topic });
    }

    this.log.debug('FhirWorker: grabbing job', { topic });
    const job = await this.models.FhirJob.grab(this.worker.id, topic);
    if (!job) {
      this.log.debug('FhirWorker: no job to grab', { topic });
      return;
    }

    this.log.debug('FhirWorker: grabbed job', { topic, jobId: job.id });

    try {
      await job.start(this.worker.id);
      this.log.info('FhirWorker: job started', {
        workerId: this.worker.id,
        topic,
        jobId: job.id,
      });
    } catch (err) {
      this.log.error('FhirWorker: failed to mark job as started', { err });
      return;
    }

    const start = Date.now();
    this.processing.add(job.id);

    try {
      await handler(job, {
        log: this.log.child({ topic, jobId: job.id }),
        models: this.models,
        sequelize: this.sequelize,
      });
    } catch (workErr) {
      try {
        await job.fail(
          this.worker.id,
          workErr.stack ?? workErr.message ?? workErr?.toString() ?? 'Unknown error',
        );
        this.log.error('FhirWorker: job failed', {
          workerId: this.worker.id,
          topic,
          jobId: job.id,
          err: workErr,
        });
      } catch (err) {
        this.log.error('FhirWorker: job failed but failed to mark as errored', { err });
        // eslint-disable-next-line no-console
        console.error(err);
      }

      return;
    } finally {
      this.processing.delete(job.id);

      if (!testMode) {
        // immediately process the queue again to work through the backlog
        setImmediate(() => Promise.allSettled([this.processQueue()]));
      }
    }

    try {
      await job.complete(this.worker.id);
      this.log.info('FhirWorker: job completed', {
        workerId: this.worker.id,
        topic,
        jobId: job.id,
        durationMs: Date.now() - start,
      });
    } catch (err) {
      this.log.error('FhirWorker: job completed but failed to mark as complete', { err });
    }
  }

  /** Cancel listening for jobs. */
  __testingSetup() {
    // listener = null;
  }
}
