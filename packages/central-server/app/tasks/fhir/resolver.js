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

export async function resolver(_, { log, sequelize, models }) {
  await sleepAsync(3000); // sleep for 3 seconds to allow materialisation jobs to complete

  const materialisableResources = resourcesThatCanDo(
    models,
    FHIR_INTERACTIONS.INTERNAL.MATERIALISE,
  );

  log.debug('Starting resolve');
  await sequelize.transaction(async () => {
    const sortedResources = sortResourcesInDependencyOrder(materialisableResources);
    for (const resource of sortedResources) {
      await resource.resolveUpstreams();
    }
  });

  log.debug('Done resolving');
}
