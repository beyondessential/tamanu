/**
  ability: a CASL ability with the permissions that the user has
  modelRecords: array of sequelize model records
  verb: string
*/
export function getFilteredListByPermission(ability, modelRecords, verb) {
  // For some reason the endpoint is not passing a list of records
  if (Array.isArray(modelRecords) === false) {
    throw new Error('The function filterByPermission expects modelRecords to be an array.');
  }

  // Only return records that the role has access to, check with the actual
  // model so the 'can' function can read the model name and match properly.
  return modelRecords.filter(row => ability.can(verb, row));
}
