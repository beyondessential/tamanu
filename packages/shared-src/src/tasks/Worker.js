import { hostname } from 'os';
import theConfig from 'config';
import ms from 'ms';

export class Worker {
  handlers = new Map();

  heartbeat = null;

  worker = null;
  
  config = theConfig.schedules.fhirJobWorker;

  constructor(context, log) {
    this.models = context.models;
    this.sequelize = context.sequelize;
    this.log = log;
  }

  async start() {
    const { JobWorker, Setting } = this.models;

    const heartbeatInterval = await Setting.get('fhir.worker.heartbeat');
    this.log.debug('FhirJobWorker: got raw heartbeat interval', { heartbeatInterval });
    const heartbeat = ms(heartbeatInterval);
    this.log.debug('FhirJobWorker: scheduling heartbeat', { intervalMs: heartbeat });

    this.worker = await JobWorker.register({
      version: 'unknown',
      serverType: 'unknown',
      hostname: hostname(),
      ...(global.serverInfo ?? {}),
    });
    this.log.info('FhirJobWorker: registered', { workerId: this.worker?.id });

    this.heartbeat = setInterval(async () => {
      try {
        this.log.debug('FhirJobWorker: heartbeat');
        await this.worker.heartbeat();
      } catch (err) {
        this.log.error('FhirJobWorker: heartbeat failed', { err });
      }
    }, heartbeat);
  }

  async installTopic(topic, Task) {
    if (this.handlers.has(topic)) {
      this.log.info('FhirJobWorker: replacing topic handler', { topic });
      this.handlers.get(topic).cancelPolling();
    }

    const { enabled, schedule, topicConcurrency } = this.config;

    if (!enabled) {
      this.log.info('FhirJobWorker: disabled');
      return;
    }

    this.log.info('FhirJobWorker: adding topic handler', { topic, schedule, topicConcurrency });
    const handler = new Task(
      {
        models: this.models,
        sequelize: this.sequelize,
      },
      this.log.child({ topic }),
      topic,
      this.worker.id,
      schedule,
      topicConcurrency,
    );
    this.handlers.set(topic, handler);
    handler.beginPolling();
  }

  async stop() {
    clearInterval(this.heartbeat);
    this.heartbeat = null;

    for (const [topic, handler] of this.handlers.entries()) {
      this.log.info('FhirJobWorker: removing topic handler', { topic });
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
