import config from 'config';

import { FHIR_INTERACTIONS } from '@tamanu/constants';

/**
 * @param {Model[]} models
 * @param  {...string} interactions
 * @returns {FhirResource[]}
 */
export function resourcesThatCanDo(models, ...interactions) {
  const workerConfig = config.integrations?.fhir?.worker;

  return Object.values(models).filter((Resource) =>
    interactions.every((interaction) => {
      // Materialisation requires the worker to be running and the resource to be enabled
      if (interaction === FHIR_INTERACTIONS.INTERNAL.MATERIALISE) {
        if (!workerConfig?.enabled || !workerConfig.resourceMaterialisationEnabled?.[Resource.fhirName]) {
          return false;
        }
      }

      return Resource.CAN_DO?.has(interaction);
    }),
  );
}
