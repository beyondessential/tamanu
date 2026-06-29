import ms from 'ms';

import { FHIR_INTERACTIONS } from '@tamanu/constants';
import { resourcesThatCanDo } from '@tamanu/shared/utils/fhir/resources';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

const buildDependencyMap = resources =>
  resources.reduce((acc, resource) => {
    acc[resource.name] = resource.referencedResources.map(r => r.name);
    return acc;
  }, {});

export const sortResourcesInDependencyOrder = resources => {
  const dependencyMap = buildDependencyMap(resources);

  const sorted = [];
  const stillToSort = new Map(resources.map(r => [r.name, r]));
  let lastSize = -1;

  while (stillToSort.size > 0) {
    if (stillToSort.size === lastSize) {
      // If the map size hasn't changed, we've made no progress and are in a loop.
      const remaining = [...stillToSort.keys()].join(', ');
      throw new Error(`Circular dependency detected: ${remaining}`);
    }
    lastSize = stillToSort.size;

    for (const [modelName, model] of stillToSort) {
      const dependsOn = dependencyMap[modelName] || [];
      const hasUnresolvedDependencies = dependsOn.some(depName => stillToSort.has(depName));

      if (!hasUnresolvedDependencies) {
        sorted.push(model);
        stillToSort.delete(modelName);
      }
    }
  }

  return sorted;
};

export async function resolver(_, { log, models }) {
  await sleepAsync(3000); // sleep for 3 seconds to allow materialisation jobs to complete

  const materialisableResources = resourcesThatCanDo(
    models,
    FHIR_INTERACTIONS.INTERNAL.MATERIALISE,
  );

  // A resolver that blocks on a lock held elsewhere (e.g. a long sync session or a
  // bulk update) would otherwise sit in 'Started' forever: its worker keeps
  // heartbeating, so no other worker reclaims the job and it never errors. Bound
  // each record's lock waits so the job fails (and retries) instead of stalling.
  const lockTimeoutMs = ms(await models.Setting.get('fhir.worker.resolverLockTimeout'));

  log.debug('Starting resolve');
  // Resources are resolved in dependency order so referenced resources are
  // materialised before the resources that reference them. Each resource resolves
  // its upstreams in its own per-record transactions (see
  // FhirResource.resolveUpstreams) rather than one transaction spanning every
  // resource, which keeps lock holds short and preserves progress if a later
  // record fails.
  const sortedResources = sortResourcesInDependencyOrder(materialisableResources);
  for (const resource of sortedResources) {
    await resource.resolveUpstreams({ lockTimeoutMs });
  }

  log.debug('Done resolving');
}
