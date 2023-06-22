/**
 * @param {Model[]} models
 * @param  {...string} interactions
 * @returns {FhirResource[]}
 */
export function resourcesThatCanDo(models, ...interactions) {
  return Object.values(models).filter(Resource =>
    interactions.every(interaction => Resource.CAN_DO?.has(interaction)),
  );
}
