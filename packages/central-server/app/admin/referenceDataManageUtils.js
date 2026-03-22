import { upperFirst } from 'lodash';
import {
  REFERENCE_TYPE_VALUES,
  OTHER_REFERENCE_TYPE_VALUES,
  GENERAL_IMPORTABLE_DATA_TYPES,
  SUGGESTER_ENDPOINTS,
} from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/errors';

export const getModelForType = (models, type) => {
  if (REFERENCE_TYPE_VALUES.includes(type)) {
    return { model: models.ReferenceData, typeFilter: { type } };
  }
  // For all other types (OTHER_REFERENCE_TYPES, clinical, system), resolve via upperFirst
  const modelName = upperFirst(type);
  const model = models[modelName];
  if (!model) {
    throw new InvalidOperationError(`No model found for type: ${type}`);
  }
  return { model, typeFilter: {} };
};

// Types that can be managed via this endpoint (must match the frontend MANAGEABLE_DATA_TYPES)
const MANAGEABLE_REFERENCE_DATA_TYPES = [...REFERENCE_TYPE_VALUES, ...OTHER_REFERENCE_TYPE_VALUES];

const HIDDEN_COLUMNS = ['createdAt', 'updatedAt', 'deletedAt', 'updatedAtSyncTick'];
// Fields that are always read-only (create and edit)
const READ_ONLY_COLUMNS = ['id', 'type'];

// Explicit overrides for FK columns where the association alias doesn't match the suggester endpoint
const FK_ENDPOINT_OVERRIDES = {
  // e.g. 'someForeignKeyId': 'customEndpoint',
};

// Build a map of foreignKey -> suggester endpoint from BelongsTo associations.
// Only allows suggesters for models that are both importable reference data and have a suggester endpoint.
const getForeignKeySuggesters = (model) => {
  const associations = model.associations ?? {};
  const fkToEndpoint = {};
  for (const assoc of Object.values(associations)) {
    if (assoc.associationType !== 'BelongsTo') continue;
    const endpoint = FK_ENDPOINT_OVERRIDES[assoc.foreignKey] ?? assoc.as;
    if (SUGGESTER_ENDPOINTS.includes(endpoint) && GENERAL_IMPORTABLE_DATA_TYPES.includes(endpoint)) {
      fkToEndpoint[assoc.foreignKey] = endpoint;
    }
  }
  return fkToEndpoint;
};

export const getColumnsForModel = (model) => {
  const rawAttributes = model.rawAttributes ?? {};
  const fkSuggesters = getForeignKeySuggesters(model);
  return Object.entries(rawAttributes)
    .filter(([key]) => !HIDDEN_COLUMNS.includes(key))
    .map(([key, attr]) => {
      const col = {
        key,
        type: attr.type?.constructor?.name ?? 'STRING',
        allowNull: attr.allowNull !== false,
        defaultValue: attr.defaultValue ?? null,
        readOnly: READ_ONLY_COLUMNS.includes(key),
      };
      if (fkSuggesters[key]) {
        col.suggesterEndpoint = fkSuggesters[key];
        col.readOnlyOnEdit = true;
      }
      return col;
    });
};

export const getUniqueFields = (model) => {
  const uniqueFields = [];
  const rawAttributes = model.rawAttributes ?? {};
  for (const [key, attr] of Object.entries(rawAttributes)) {
    if (attr.unique) {
      uniqueFields.push(key);
    }
  }
  const indexes = model.options?.indexes ?? [];
  for (const index of indexes) {
    if (index.unique && index.fields?.length === 1) {
      uniqueFields.push(index.fields[0]);
    }
  }
  return [...new Set(uniqueFields)];
};

export const assertValidType = (type) => {
  if (!type) {
    throw new InvalidOperationError('type is required in request body');
  }

  if (!MANAGEABLE_REFERENCE_DATA_TYPES.includes(type)) {
    throw new InvalidOperationError(`Invalid reference data type: ${type}`);
  }
};

export const getWritableData = (columns, data, isEditMode) => {
  const writableKeys = new Set(
    columns.filter((c) => !c.readOnly && !(isEditMode && c.readOnlyOnEdit)).map((c) => c.key),
  );
  return Object.fromEntries(Object.entries(data).filter(([key]) => writableKeys.has(key)));
};
