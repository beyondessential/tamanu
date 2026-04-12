import { upperFirst } from 'lodash';
import {
  REFERENCE_TYPE_VALUES,
  MANAGEABLE_REFERENCE_DATA_TYPES,
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

// Columns hidden from the admin UI.
// true = hidden for all models, Set = hidden only for those models.
const HIDDEN_COLUMNS = {
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  updatedAtSyncTick: true,
  type: new Set(['ReferenceData']),
};

const isColumnHidden = (key, modelName) => {
  const rule = HIDDEN_COLUMNS[key];
  if (rule === true) return true;
  if (rule instanceof Set) return rule.has(modelName);
  return false;
};

// Fields that are read-only only on edit
const READONLY_ON_EDIT_COLUMNS = /** @type {const} */ (new Set(['id']));

// Fields that are always read-only (hidden from form) for specific models
const READONLY_COLUMNS = {
  id: new Set(['ReferenceDataRelation']),
};

// FK columns that should render as multi-select autocomplete instead of single select
const MULTI_SELECT_FK_COLUMNS = new Set(['ReferenceDataRelation.referenceDataId']);

// Explicit overrides for FK columns where the association alias doesn't match the suggester endpoint.
// Keyed by "ModelName.foreignKey" to handle the same FK name on different models.
// Add an entry here when a BelongsTo alias doesn't match the suggester endpoint name.
const FK_ENDPOINT_OVERRIDES = /** @type {const} */ {
  'LabTestType.labTestCategoryId': 'labTestCategory',
  'LabTestPanel.categoryId': 'labTestCategory',
  'PatientFieldDefinition.categoryId': 'patientFieldDefinitionCategory',
  'InvoicePriceListItem.invoiceProductId': 'invoiceProduct',
  'InvoicePriceListItem.invoicePriceListId': 'invoicePriceList',
  'CertifiableVaccine.vaccineId': 'drug',
  'ScheduledVaccine.vaccineId': 'drug',
  'ReferenceDataRelation.referenceDataId': 'referenceData',
  'ReferenceDataRelation.referenceDataParentId': 'referenceData',
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
    .filter(([key]) => !isColumnHidden(key, model.name))
    .map(([key, attr]) => {
      const dbField = attr.field ?? key;
      const dbCol = dbColumns.get(dbField);
      const typeName = attr.type?.constructor?.name ?? 'STRING';
      const col = {
        key,
        type: typeName,
        allowNull: dbCol ? dbCol.is_nullable === 'YES' : attr.allowNull !== false,
        hasDefault: dbCol ? dbCol.column_default != null : attr.defaultValue != null,
        readOnly: READONLY_COLUMNS[key]?.has(model.name) ?? false,
        readOnlyOnEdit: READONLY_ON_EDIT_COLUMNS.has(key),
      };
      if (typeName === 'ENUM' && attr.type?.values) {
        col.enumValues = attr.type.values;
      }
      if (fkSuggesters[key]) {
        col.suggesterEndpoint = fkSuggesters[key];
        col.readOnlyOnEdit = true;
        if (MULTI_SELECT_FK_COLUMNS.has(`${model.name}.${key}`)) {
          col.multiSelect = true;
        }
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

/**
 * Creates records for multi-select FK columns by expanding array values into individual rows.
 * Restores soft-deleted records if they match instead of creating duplicates.
 * Returns null if no multi-select columns have array values (caller should handle normal create).
 */
export const createMultiSelectRecords = async (model, columns, data, typeFilter) => {
  const multiCol = columns.find(c => c.multiSelect && Array.isArray(data[c.key]));
  if (!multiCol) return null;

  const records = [];
  for (const value of data[multiCol.key]) {
    const rowData = { ...typeFilter, ...data, [multiCol.key]: value };
    const existing = await model.findOne({ where: rowData, paranoid: false });
    if (existing?.deletedAt) {
      await existing.restore();
      records.push(existing.forResponse());
    } else {
      const record = await model.create(rowData);
      records.push(record.forResponse());
    }
  }
  return records;
};
