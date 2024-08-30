import { FhirWorker } from '@tamanu/shared/tasks';
import { JOB_TOPICS } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import config from 'config';

import { allFromUpstream } from './refresh/allFromUpstream';
import { entireResource } from './refresh/entireResource';
import { fromUpstream } from './refresh/fromUpstream';
import { resolver } from './resolver';

export async function startFhirWorkerTasks({ store }) {
  // This config is a temporary hack to allow us to use a different worker config for ASPEN
  // Will address this properly in SAV-813
  const { aspenParallelFhirWorkerEnabled } = config.integrations.fhir;

  const workers = [];
  if (aspenParallelFhirWorkerEnabled) {
    const resolverWorker = new FhirWorker(store, log);
    const refreshWorker = new FhirWorker(store, log);

    resolverWorker.setHandler(JOB_TOPICS.FHIR.RESOLVER, resolver);
    refreshWorker.setHandler(JOB_TOPICS.FHIR.REFRESH.ALL_FROM_UPSTREAM, allFromUpstream);
    refreshWorker.setHandler(JOB_TOPICS.FHIR.REFRESH.ENTIRE_RESOURCE, entireResource);
    refreshWorker.setHandler(JOB_TOPICS.FHIR.REFRESH.FROM_UPSTREAM, fromUpstream);

    workers.push(resolverWorker, refreshWorker);
  } else {
    const worker = new FhirWorker(store, log);

    worker.setHandler(JOB_TOPICS.FHIR.REFRESH.ALL_FROM_UPSTREAM, allFromUpstream);
    worker.setHandler(JOB_TOPICS.FHIR.REFRESH.ENTIRE_RESOURCE, entireResource);
    worker.setHandler(JOB_TOPICS.FHIR.REFRESH.FROM_UPSTREAM, fromUpstream);
    worker.setHandler(JOB_TOPICS.FHIR.RESOLVER, resolver);

    workers.push(worker);
  }

  await Promise.all(workers.map(worker => worker.start()));
  workers.forEach(worker => worker.processQueueNow());

  return workers;
}
