import { FhirWorker } from '@tamanu/shared/tasks';
import { JOB_TOPICS } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';

import { allFromUpstream } from './refresh/allFromUpstream';
import { entireResource } from './refresh/entireResource';
import { fromUpstream } from './refresh/fromUpstream';
import { resolver } from './resolver';

export async function startFhirWorkerTasks({ store, topics }) {
  const worker = new FhirWorker(store, log);
  await worker.start();

  const setHandler = async (topic, handler) => {
    if (!topics || topics.includes(topic)) {
      await worker.setHandler(topic, handler);
    }
  };

  await setHandler(JOB_TOPICS.FHIR.REFRESH.ALL_FROM_UPSTREAM, allFromUpstream);
  await setHandler(JOB_TOPICS.FHIR.REFRESH.ENTIRE_RESOURCE, entireResource);
  await setHandler(JOB_TOPICS.FHIR.REFRESH.FROM_UPSTREAM, fromUpstream);
  await setHandler(JOB_TOPICS.FHIR.RESOLVER, resolver);

  worker.processQueueNow();
  return worker;
}
