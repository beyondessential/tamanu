export const PARENT_ID_TYPES = {
  STATIC: 'STATIC',
  DYNAMIC: 'DYNAMIC',
};

export const paramsToParentIdConfigs = params =>
  Object.entries(params).map(([key, value]) => ({
    key,
    value,
    type: PARENT_ID_TYPES.STATIC,
  }));

export const associationToParentIdConfigs = association => [
  {
    key: association.foreignKey,
    type: PARENT_ID_TYPES.DYNAMIC,
  },
];

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
