import { FHIR_INTERACTIONS } from '@tamanu/constants';

import { getFhirWorkerSettings } from './fhirSettings';

/**
 * @param {Model[]} models
 * @param  {...string} interactions
 * @returns {FhirResource[]}
 */
export function resourcesThatCanDo(models, ...interactions) {
  const workerSettings = getFhirWorkerSettings();
  return Object.values(models).filter((Resource) =>
    interactions.every((interaction) => {
      // Check if materialisation of resource is enabled
      if (
        !workerSettings.enabled ||
        (interaction === FHIR_INTERACTIONS.INTERNAL.MATERIALISE &&
          !workerSettings.resourceMaterialisationEnabled[Resource.fhirName])
      ) {
        return false;
      }

      return Resource.CAN_DO?.has(interaction);
    }),
  );
}
