/*
 *   A parent id config is an object like follows:
 *   {
 *     // type of parent id
 *     // (static has a static value, dynamic is retrieved from a parent)
 *     type: 'STATIC' | 'DYNAMIC';
 *     // name of a key on the child object that should be set to the parent id
 *     key: string;
 *     // only available if type === 'STATIC', represents a static id to set
 *     value?: string;
 *   }
 *
 *   Import and export plans both include parent id configs, and use them to
 * query child objects/verify a child matches its parent.
 */

// the two possible types of parent id
export const PARENT_ID_TYPES = {
  STATIC: 'STATIC',
  DYNAMIC: 'DYNAMIC',
};

/*
 * Converts params from sequelize.channelRouter into an array of parent id configs
 *
 * Input:
 *    { patientId: 'abc123' }
 *
 * Output:
 *    { type: 'STATIC', key: 'patientId', value: 'abc123' }
 */
export const paramsToParentIdConfigs = params =>
  Object.entries(params).map(([key, value]) => ({
    key,
    value,
    type: PARENT_ID_TYPES.STATIC,
  }));

/*
 * Converts an association into an array of one parent id config
 *
 * Input:
 *    Encounter.associations.administeredVaccines
 *
 * Output:
 *    { type: 'DYNAMIC', key: 'encounterId' }
 */
export const associationToParentIdConfigs = association => [
  {
    key: association.foreignKey,
    type: PARENT_ID_TYPES.DYNAMIC,
  },
];

/*
 * Extracts a dynamic parent id from parent id configs and an object
 *
 * Input:
 *    ([{ type: 'DYNAMIC', key: 'encounterId' }], { id: 'def456' })
 *
 * Output:
 *    { encounterId: 'def456' }
 */
export const extractDynamicParentIds = (parentIdConfigs, parent) => {
  if (parentIdConfigs.length > 1) {
    throw new Error('Expected a single parent id config');
  }
  const parentIds = {};
  for (const { key, type } of parentIdConfigs) {
    if (type !== PARENT_ID_TYPES.DYNAMIC) {
      throw new Error(`Expected dynamic parent id config, recieved a key of type ${type}: ${key}`);
    }
    parentIds[key] = parent.id;
  }
  return parentIds;
};

/*
 * Extracts a static parent id from parent id configs and an object
 *
 * Input:
 *    [{ type: 'STATIC', key: 'patientId', value: 'abc123' }]
 *
 * Output:
 *    { patientId 'abc123' }
 */
export const extractStaticParentIds = parentIdConfigs => {
  const parentIds = {};
  for (const { key, value, type } of parentIdConfigs) {
    if (type !== PARENT_ID_TYPES.STATIC) {
      throw new Error(`Expected static parent id configs, recieved key of type ${type}: ${key}`);
    }
    if (!value) {
      throw new Error(`Expected truthy value for parentId, received falsey: ${key}=${value}`);
    }
    parentIds[key] = value;
  }
  return parentIds;
};

/*
 * Throws if an object's keys don't match another object; otherwise, passes the first object back
 *
 * Input:
 *    ({ a: 1, b: 2 }, { b: 2 })
 *
 * Output:
 *    { a: 1, b: 2 }
 */
export const assertParentIdsMatch = (data, parentIds) => {
  for (const [key, parentValue] of Object.entries(parentIds)) {
    const dataValue = data[key];
    if (parentValue !== dataValue) {
      throw new Error(
        `Mismatch between parentId ${key}, expected ${parentValue} but got ${dataValue}`,
      );
    }
  }
  return data;
};
