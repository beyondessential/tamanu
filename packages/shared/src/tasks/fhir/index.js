import { FhirQueueManager } from './FhirQueueManager';
import { JOB_TOPICS, NOTIFY_CHANNELS } from '@tamanu/constants';
import { registerSettingsCacheInvalidator } from '@tamanu/settings/cache';
import { log } from '../../services/logging';
import { defineDbNotifier } from '../../services/dbNotifier';

import { allFromUpstream } from './refresh/allFromUpstream';
import { entireResource } from './refresh/entireResource';
import { fromUpstream } from './refresh/fromUpstream';
import { resolver } from './resolver';

/**
 * Run the FHIR worker process. Shared between central-server and facility-server.
 * @param {object} options
 * @param {{ store: object, close: () => Promise<void>, waitForClose: () => Promise<void> }} options.context - Inited application context
 * @param {{ get: (key: string) => Promise<unknown> }} options.settings - ReadSettings for fhir.worker.* (e.g. central context.settings, facility context.settings[facilityId])
 * @param {string} options.serverName - For logging, e.g. 'Central' or 'Facility'
 * @param {string} options.version - Server version string
 * @param {string | string[] | null} [options.topics] - Comma string or array; null = all
 */
export async function runStartFhirWorker({ context, settings, serverName, version, topics }) {
  log.info(`Starting ${serverName} FHIR worker version ${version}`);

  // Keep the worker's process-local settings cache in sync via NOTIFYs.
  const dbNotifier = await defineDbNotifier(context.store.sequelize.config, [
    NOTIFY_CHANNELS.TABLE_CHANGED,
  ]);
  registerSettingsCacheInvalidator(dbNotifier.listeners[NOTIFY_CHANNELS.TABLE_CHANGED]);
  context.onClose(() => dbNotifier.close());

  if (!topics || topics === 'all') {
    topics = null;
  } else {
    topics = topics.split(/,+\s*/).filter(Boolean);
    log.info(`FHIR worker restricted to topics: ${topics.join(', ')}`);
  }

  const worker = await startFhirWorkerTasks({
    store: context.store,
    settings,
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
