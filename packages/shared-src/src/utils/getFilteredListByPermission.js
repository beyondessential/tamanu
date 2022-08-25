/**
  ability: a CASL ability with the permissions that the user has
  modelRecords: array of sequelize model records
  action: string
*/
export function getFilteredListByPermission(ability, modelRecords, action) {
  // Only return records that the role has access to, check with the actual
  // model so the 'can' function can read the model name and match properly.
  return modelRecords.filter(row => ability.can(action, row));
}
