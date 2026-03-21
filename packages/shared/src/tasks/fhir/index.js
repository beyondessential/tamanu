import { FhirQueueManager } from './FhirQueueManager';
import { JOB_TOPICS } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';

import { allFromUpstream } from './refresh/allFromUpstream';
import { entireResource } from './refresh/entireResource';
import { fromUpstream } from './refresh/fromUpstream';
import { resolver } from './resolver';

/**
 * Run the FHIR worker process. Shared between central-server and facility-server.
 * @param {object} options
 * @param {{ init: (opts: { appType: string, dbKey?: string }) => Promise<{ store: object, close: () => Promise<void>, waitForClose: () => Promise<void> }> }} options.ApplicationContext - Context class with .init({ appType, dbKey })
 * @param {string} options.appType - e.g. 'fhir-worker'
 * @param {string} options.serverName - For logging, e.g. 'Central' or 'Facility'
 * @param {string} options.version - Server version string
 * @param {string} [options.name] - Optional worker name for dbKey
 * @param {boolean} [options.skipMigrationCheck]
 * @param {string | string[] | null} [options.topics] - Comma string or array; null = all
 */
export async function runStartFhirWorker({
  ApplicationContext,
  appType,
  serverName,
  version,
  name,
  skipMigrationCheck,
  topics,
}) {
  log.info(`Starting ${serverName} FHIR worker version ${version}`);

  const dbKey = name ? `${appType}(${name})` : appType;
  const context = await new ApplicationContext().init({ appType, dbKey });
  await context.store.sequelize.assertUpToDate({ skipMigrationCheck });

  if (!topics || topics === 'all') {
    topics = null;
  } else {
    topics = topics.split(/,+\s*/).filter(Boolean);
    log.info(`FHIR worker restricted to topics: ${topics.join(', ')}`);
  }

  const worker = await startFhirWorkerTasks({
    store: context.store,
    settings: context.settings,
    topics,
  });

  for (const sig of ['SIGINT', 'SIGTERM']) {
    process.once(sig, async () => {
      log.info(`Received ${sig}, stopping fhir worker`);
      await worker.stop();
      context.close();
    });
  }

  await context.waitForClose();
}

export async function startFhirWorkerTasks({ store, settings, topics }) {
  const queueManager = new FhirQueueManager(store, settings, log);
  await queueManager.start();

  const setHandler = async (topic, handler) => {
    if (!topics || topics.includes(topic)) {
      await queueManager.setHandler(topic, handler);
    }
  };

  await setHandler(JOB_TOPICS.FHIR.REFRESH.ALL_FROM_UPSTREAM, allFromUpstream);
  await setHandler(JOB_TOPICS.FHIR.REFRESH.ENTIRE_RESOURCE, entireResource);
  await setHandler(JOB_TOPICS.FHIR.REFRESH.FROM_UPSTREAM, fromUpstream);
  await setHandler(JOB_TOPICS.FHIR.RESOLVER, resolver);

  for (const topic of queueManager.topics()) {
    queueManager.processQueueNow(topic);
  }

  return queueManager;
}

export { createFhirCommand } from './fhirCommand';
