import * as resources from '../../models/fhir';

/**
 * @param  {...string} interactions
 * @returns {FhirResource[]}
 */
export function resourcesThatCanDo(...interactions) {
  return Object.values(resources).filter(Resource =>
    interactions.every(interaction => Resource.CAN_DO?.has(interaction)),
  );
}
