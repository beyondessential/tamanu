import config from 'config';
import { merge } from 'lodash';
import ms from 'ms';

class Worker {
  handlers = new Map();
  heartbeart = null;
  worker = null;

  constructor(context, log) {
    this.models = context.models;
    this.sequelize = context.sequelize;
    this.log = log;
  }

  async start() {
    const { JobWorker, Setting } = this.models;
    this.worker = await JobWorker.register();

    const heartbeat = ms(await Setting.get('jobs.worker.heartbeat'));
    this.log.debug('Worker: scheduling heartbeat', { intervalMs: heartbeat });
    this.heartbeart = setInterval(() => Promise.allSettled(this.worker.heartbeat()), heartbeat);
  }

  async handleTopic(topic, Task) {
    if (this.handlers.has(topic)) {
      this.log.info('Worker: replacing topic handler', { topic });
      this.handlers.get(topic).cancelPolling();
    }

    const { Setting } = this.models;
    const { serverFacilityId = null } = config;

    const defaults = await Setting.get(`jobs.topics.default`, serverFacilityId);
    const { schedule, maxConcurrency } = merge(
      defaults,
      (await Setting.get(`jobs.topics.${topic}`, serverFacilityId)) ?? {},
    );

    this.log.info('Worker: adding topic handler', { topic, schedule, maxConcurrency });
    const handler = new Task(
      {
        models: this.models,
        sequelize: this.sequelize,
      },
      topic,
      this.worker.id,
      schedule,
      maxConcurrency,
    );
    this.handlers.set(topic, handler);
    handler.beginPolling();
  }

  async stop() {
    clearInterval(this.heartbeart);
    this.heartbeart = null;

    for (const [topic, handler] of this.handlers.entries()) {
      this.log.info('Worker: removing topic handler', { topic });
      handler.cancelPolling();
    }
    this.handlers.clear();

    await this.worker.deregister();
    this.worker = null;
  }
}
