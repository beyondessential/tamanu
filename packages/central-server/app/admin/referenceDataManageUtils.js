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

const HIDDEN_COLUMNS = /** @type {const} */ (
  new Set(['createdAt', 'updatedAt', 'deletedAt', 'updatedAtSyncTick'])
);

// Fields that are always read-only (create and edit)
const READONLY_COLUMNS = /** @type {const} */ (new Set(['type']));
// Fields that are read-only only on edit
const READONLY_ON_EDIT_COLUMNS = /** @type {const} */ (new Set(['id']));

// Explicit overrides for FK columns where the association alias doesn't match the suggester endpoint.
// Keyed by "ModelName.foreignKey" to handle the same FK name on different models.
// Add an entry here when a BelongsTo alias doesn't match the suggester endpoint name.
const FK_ENDPOINT_OVERRIDES = /** @type {const} */ {
  'LabTestType.labTestCategoryId': 'labTestCategory',
  'LabTestPanel.categoryId': 'labTestCategory',
  'PatientFieldDefinition.categoryId': 'patientFieldDefinitionCategory',
  'InvoicePriceListItem.invoiceProductId': 'invoiceProduct',
  'InvoicePriceListItem.invoicePriceListId': 'invoicePriceList',
};

// Build a map of foreignKey -> suggester endpoint from BelongsTo associations.
// Only allows suggesters for models that are both importable reference data and have a suggester endpoint.
const getForeignKeySuggesters = model => {
  const associations = model.associations ?? {};
  const fkToEndpoint = {};
  for (const assoc of Object.values(associations)) {
    if (assoc.associationType !== 'BelongsTo') {
      continue;
    }
    const overrideKey = `${model.name}.${assoc.foreignKey}`;
    const endpoint = FK_ENDPOINT_OVERRIDES[overrideKey] ?? assoc.as;
    if (SUGGESTER_ENDPOINTS.includes(endpoint)) {
      fkToEndpoint[assoc.foreignKey] = endpoint;
    }
  }
  return fkToEndpoint;
};

const getDbColumnInfo = async model => {
  const tableName = model.getTableName();
  const [results] = await model.sequelize.query(
    `SELECT column_name, is_nullable, column_default
     FROM information_schema.columns
     WHERE table_name = :tableName AND table_schema = 'public'`,
    { replacements: { tableName } },
  );
  return new Map(results.map(row => [row.column_name, row]));
};

export const getColumnsForModel = async model => {
  const rawAttributes = model.rawAttributes ?? {};
  const fkSuggesters = getForeignKeySuggesters(model);
  const dbColumns = await getDbColumnInfo(model);

  return Object.entries(rawAttributes)
    .filter(([key]) => !HIDDEN_COLUMNS.has(key))
    .map(([key, attr]) => {
      const dbField = attr.field ?? key;
      const dbCol = dbColumns.get(dbField);
      const col = {
        key,
        type: attr.type?.constructor?.name ?? 'STRING',
        allowNull: dbCol ? dbCol.is_nullable === 'YES' : attr.allowNull !== false,
        hasDefault: dbCol ? dbCol.column_default != null : attr.defaultValue != null,
        readOnly: READONLY_COLUMNS.has(key),
        readOnlyOnEdit: READONLY_ON_EDIT_COLUMNS.has(key),
      };
      if (fkSuggesters[key]) {
        col.suggesterEndpoint = fkSuggesters[key];
        col.readOnlyOnEdit = true;
      }
      return col;
    });
};

export const assertValidType = type => {
  if (!type) {
    throw new InvalidOperationError('type is required in request body');
  }

  if (!MANAGEABLE_REFERENCE_DATA_TYPES.includes(type)) {
    throw new InvalidOperationError(`Invalid reference data type: ${type}`);
  }
};

export const getWritableData = (columns, data, isEditMode) => {
  const writableKeys = new Set(
    columns.filter(c => !c.readOnly && !(isEditMode && c.readOnlyOnEdit)).map(c => c.key),
  );
  return Object.fromEntries(Object.entries(data).filter(([key]) => writableKeys.has(key)));
};
