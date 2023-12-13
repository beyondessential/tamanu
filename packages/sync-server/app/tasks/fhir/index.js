import { JOB_TOPICS } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import { FhirWorker } from '@tamanu/shared/tasks';

import { allFromUpstream } from './refresh/allFromUpstream';
import { entireResource } from './refresh/entireResource';
import { fromUpstream } from './refresh/fromUpstream';
import { resolver } from './resolver';

export async function startFhirWorkerTasks({ store }) {
  const worker = new FhirWorker(store, log);
  await worker.start();

  worker.setHandler(JOB_TOPICS.FHIR.REFRESH.ALL_FROM_UPSTREAM, allFromUpstream);
  worker.setHandler(JOB_TOPICS.FHIR.REFRESH.ENTIRE_RESOURCE, entireResource);
  worker.setHandler(JOB_TOPICS.FHIR.REFRESH.FROM_UPSTREAM, fromUpstream);
  worker.setHandler(JOB_TOPICS.FHIR.RESOLVER, resolver);

  worker.processQueueNow();
  return worker;
}
