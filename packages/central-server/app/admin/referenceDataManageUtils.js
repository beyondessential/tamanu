import { Op } from 'sequelize';
import { upperFirst } from 'es-toolkit/compat';
import {
  REFERENCE_TYPE_VALUES,
  REFERENCE_TYPES,
  REFERENCE_DATA_RELATION_TYPES,
  MANAGEABLE_REFERENCE_DATA_TYPES,
  SUGGESTER_ENDPOINTS,
} from '@tamanu/constants';
import { DatabaseDuplicateError, InvalidOperationError } from '@tamanu/errors';

// Some reference data types have a value stored as a ReferenceDataRelation (parent = this record,
// child = another reference-data record) rather than a column. The manage UI surfaces it as a
// synthetic suggester column (idKey, writable) plus a read-only name column (nameKey) for the
// table; getColumnsForModel injects those, and the list/create/edit handlers translate between the
// column and the relation. Currently just lab test category's default specimen type.
export const RELATION_BACKED_COLUMNS = {
  [REFERENCE_TYPES.LAB_TEST_CATEGORY]: {
    idKey: 'defaultSpecimenTypeId',
    nameKey: 'defaultSpecimenType',
    relationType: REFERENCE_DATA_RELATION_TYPES.DEFAULT_SPECIMEN_TYPE,
    suggesterEndpoint: 'specimenType',
  },
};

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
  'InvoiceInsurancePlanItem.invoiceProductId': 'invoiceProduct',
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

// For each BelongsTo FK column that gets a suggester, expose a read-only companion column holding
// the associated record's name, so admins can see and search on the name (the raw FK column shows
// only the id). Keyed by the association alias, and only when the target actually has a `name`.
const getForeignKeyNameColumns = model => {
  const associations = model.associations ?? {};
  const columns = [];
  for (const assoc of Object.values(associations)) {
    if (assoc.associationType !== 'BelongsTo') continue;
    const overrideKey = `${model.name}.${assoc.foreignKey}`;
    const endpoint = FK_ENDPOINT_OVERRIDES[overrideKey] ?? assoc.as;
    if (!SUGGESTER_ENDPOINTS.includes(endpoint)) continue;
    if (!assoc.target?.rawAttributes?.name) continue;
    columns.push({
      key: assoc.as,
      type: 'STRING',
      allowNull: true,
      hasDefault: false,
      readOnly: true, // excluded from the create/edit form, validation and writable data
      isFkName: true,
      fkKey: assoc.foreignKey,
      // lets the search bar render a name-mode autocomplete rather than free text
      suggesterEndpoint: endpoint,
    });
  }
  return columns;
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

export const getColumnsForModel = async (model, referenceDataType) => {
  const rawAttributes = model.rawAttributes ?? {};
  const fkSuggesters = getForeignKeySuggesters(model);
  const dbColumns = await getDbColumnInfo(model);

  const baseColumns = Object.entries(rawAttributes)
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

  // Slot each FK's read-only name column in immediately after its id column.
  const nameColByFk = new Map(getForeignKeyNameColumns(model).map(c => [c.fkKey, c]));
  const columns = baseColumns.flatMap(col => {
    const nameCol = nameColByFk.get(col.key);
    return nameCol ? [col, nameCol] : [col];
  });

  // Append the synthetic relation-backed columns (a writable suggester + a read-only name), if any.
  const relationBacked = RELATION_BACKED_COLUMNS[referenceDataType];
  if (!relationBacked) return columns;
  return [
    ...columns,
    {
      key: relationBacked.idKey,
      type: 'STRING',
      allowNull: true,
      hasDefault: false,
      readOnly: false,
      readOnlyOnEdit: false,
      suggesterEndpoint: relationBacked.suggesterEndpoint,
      isRelationBacked: true,
    },
    {
      key: relationBacked.nameKey,
      type: 'STRING',
      allowNull: true,
      hasDefault: false,
      readOnly: true,
      isRelationBacked: true,
    },
  ];
};

// Populate each row's relation-backed value (child id + child name) from the ReferenceDataRelation,
// so the manage table and edit form can display and edit it. Mutates rows in place.
export const attachRelationBackedValues = async (models, referenceDataType, rows) => {
  const config = RELATION_BACKED_COLUMNS[referenceDataType];
  if (!config || rows.length === 0) return;

  const parentIds = rows.map(row => row.id);
  const relations = await models.ReferenceDataRelation.findAll({
    attributes: ['referenceDataParentId', 'referenceDataId'],
    where: {
      type: config.relationType,
      referenceDataParentId: { [Op.in]: parentIds },
    },
    include: [{ association: 'referenceData', attributes: ['id', 'name'] }],
  });
  const byParentId = new Map(relations.map(relation => [relation.referenceDataParentId, relation]));

  for (const row of rows) {
    const relation = byParentId.get(row.id);
    row[config.idKey] = relation?.referenceDataId ?? null;
    row[config.nameKey] = relation?.referenceData?.name ?? null;
  }
};

// Translate a create/edit payload's relation-backed value into an at-most-one ReferenceDataRelation
// (destroy-then-recreate). A blank value clears it. Returns whether this type has such a column.
export const applyRelationBackedWrite = async (models, referenceDataType, parentId, rawData) => {
  const config = RELATION_BACKED_COLUMNS[referenceDataType];
  if (!config) return false;

  const childId = rawData[config.idKey] || null;
  await models.ReferenceDataRelation.destroy({
    where: {
      referenceDataParentId: parentId,
      type: config.relationType,
      ...(childId ? { referenceDataId: { [Op.ne]: childId } } : {}),
    },
  });

  if (childId) {
    const existing = await models.ReferenceDataRelation.findOne({
      where: { referenceDataParentId: parentId, referenceDataId: childId, type: config.relationType },
      paranoid: false,
    });
    if (existing) {
      if (existing.deletedAt) await existing.restore();
    } else {
      await models.ReferenceDataRelation.create({
        referenceDataParentId: parentId,
        referenceDataId: childId,
        type: config.relationType,
      });
    }
  }

  return true;
};

// Relation-backed values aren't real columns, so drop them from the column write set.
export const stripRelationBackedKeys = (referenceDataType, data) => {
  const config = RELATION_BACKED_COLUMNS[referenceDataType];
  if (!config) return data;
  const rest = { ...data };
  delete rest[config.idKey];
  delete rest[config.nameKey];
  return rest;
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
 * Restores soft-deleted records if they match; throws if an active row already matches the key.
 * Returns null if no multi-select columns have array values (caller should handle normal create).
 */
export const createMultiSelectRecords = async (model, columns, data, typeFilter) => {
  const multiCol = columns.find(c => c.multiSelect && Array.isArray(data[c.key]));
  if (!multiCol) return null;

  const records = [];
  for (const value of data[multiCol.key]) {
    const rowData = { ...typeFilter, ...data, [multiCol.key]: value };
    const existing = await model.findOne({ where: rowData, paranoid: false });
    if (existing) {
      if (existing.deletedAt) {
        await existing.restore();
        records.push(existing.forResponse());
      } else {
        throw new DatabaseDuplicateError(
          `A ${model.name} record with this combination of fields already exists`,
        );
      }
    } else {
      const record = await model.create(rowData);
      records.push(record.forResponse());
    }
  }
  return records;
};
