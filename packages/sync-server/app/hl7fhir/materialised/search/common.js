/**
 * Fetch the sequelize field definition
 *
 * Generally want the .field value for the in-sql column name
 */
export function findField(Model, field) {
  if (Model.rawAttributes && Model.rawAttributes[field]) {
    return Model.rawAttributes[field];
  }

  if (Model.fieldRawAttributesMap && Model.fieldRawAttributesMap[field]) {
    return Model.fieldRawAttributesMap[field];
  }

  return field;
}

export function pushToQuery(query, param, value) {
  const insert = query.get(param) ?? [];
  insert.push(value);
  query.set(param, insert);
}
