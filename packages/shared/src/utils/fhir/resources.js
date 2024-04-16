import config from 'config';

import { FHIR_INTERACTIONS } from '@tamanu/constants';

/**
 * @param {Model[]} models
 * @param  {...string} interactions
 * @returns {FhirResource[]}
 */
export function resourcesThatCanDo(models, ...interactions) {
  return Object.values(models).filter(Resource =>
    interactions.every(interaction => {
      // Check if materialisation of resource is enabled
      if (
        interaction === FHIR_INTERACTIONS.INTERNAL.MATERIALISE &&
        !config.integrations.fhir.worker.resourceMaterialisationEnabled[Resource.fhirName]
      ) {
        return false;
      }

      return Resource.CAN_DO?.has(interaction);
    }),
  );
}
