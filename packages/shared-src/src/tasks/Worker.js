import { hostname } from 'os';
import config from 'config';
import { merge } from 'lodash';
import ms from 'ms';

export class Worker {
  handlers = new Map();

  heartbeat = null;

  worker = null;

  constructor(context, log) {
    this.models = context.models;
    this.sequelize = context.sequelize;
    this.log = log;
  }

  async start() {
    const { JobWorker, Setting } = this.models;

    const heartbeatInterval = await Setting.get('jobs.worker.heartbeat');
    this.log.debug('Worker: got raw heartbeat interval', { heartbeatInterval });
    const heartbeat = ms(heartbeatInterval);
    this.log.debug('Worker: scheduling heartbeat', { intervalMs: heartbeat });

    this.worker = await JobWorker.register({
      version: 'unknown',
      serverType: 'unknown',
      hostname: hostname(),
      ...(global.serverInfo ?? {}),
    });
    this.log.info('Worker: registered', { workerId: this.worker?.id });

    this.heartbeat = setInterval(async () => {
      try {
        this.log.debug('Worker: heartbeat');
        await this.worker.heartbeat();
      } catch (err) {
        this.log.error('Worker: heartbeat failed', { err });
      }
    }, heartbeat);
  }

  async installTopic(topic, Task) {
    if (this.handlers.has(topic)) {
      this.log.info('Worker: replacing topic handler', { topic });
      this.handlers.get(topic).cancelPolling();
    }

    const { Setting } = this.models;
    const { serverFacilityId = null } = config;

    const defaults = await Setting.get(`jobs.topics.default`, serverFacilityId);
    const { enabled, schedule, maxConcurrency } = merge(
      defaults,
      (await Setting.get(`jobs.topics.${topic}`, serverFacilityId)) ?? {},
    );

    if (!enabled) {
      this.log.info('Worker: topic disabled', { topic });
      return;
    }

    this.log.info('Worker: adding topic handler', { topic, schedule, maxConcurrency });
    const handler = new Task(
      {
        models: this.models,
        sequelize: this.sequelize,
      },
      this.log.child({ topic }),
      topic,
      this.worker.id,
      schedule,
      maxConcurrency,
    );
    this.handlers.set(topic, handler);
    handler.beginPolling();
  }

  async stop() {
    clearInterval(this.heartbeat);
    this.heartbeat = null;

    for (const [topic, handler] of this.handlers.entries()) {
      this.log.info('Worker: removing topic handler', { topic });
      handler.cancelPolling();
    }
    this.handlers.clear();

    await this.worker.deregister();
    this.worker = null;
  }
  
  /** Cancel automatic processing of tasks. */
  __testingSetup() {
    for (const handler of this.handlers.values()) {
      handler.cancelPolling();
    }
  }

  /** Poll a topic once, as if it was on schedule. */
  __testingRunOnce(topic) {
    const handler = this.handlers.get(topic);
    return handler?.runImmediately();
  }
}
