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
      // Materialisation requires the worker to be running and the resource to be enabled
      if (interaction === FHIR_INTERACTIONS.INTERNAL.MATERIALISE) {
        if (!workerSettings?.enabled || !workerSettings.resourceMaterialisationEnabled?.[Resource.fhirName]) {
          return false;
        }
      }

      return Resource.CAN_DO?.has(interaction);
    }),
  );
}
