import { FHIR_INTERACTIONS } from '@tamanu/constants';
import { resourcesThatCanDo } from '@tamanu/shared/utils/fhir/resources';
import { sleepAsync } from '@tamanu/utils/sleepAsync';
import { isEqual, keyBy } from 'lodash';

const buildDependencyMap = resources =>
  resources.reduce((acc, resource) => {
    acc[resource.name] = resource.referencedResources.map(r => r.name);
    return acc;
  }, {});

const sortResourcesInDependencyOrder = resources => {
  const dependencyMap = buildDependencyMap(resources);

  const sorted = [];
  const stillToSort = keyBy(resources, 'name');
  let previousPass = { ...stillToSort }; // Used to detect if we've made any changes in this pass

  while (Object.keys(stillToSort).length > 0) {
    Object.values(stillToSort).forEach(model => {
      const modelName = model.name;
      const dependsOn = dependencyMap[modelName] || [];
      const dependenciesStillToSort = dependsOn.filter(d => !!stillToSort[d]);

      if (dependenciesStillToSort.length === 0) {
        sorted.push(model);
        delete stillToSort[modelName];
      }
    });

    if (isEqual(previousPass, stillToSort)) {
      // If nothing changes in a pass, we're stuck in a loop
      throw new Error(`Circular dependency detected: ${Object.keys(stillToSort).join(', ')}`);
    }

    previousPass = { ...stillToSort };
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
