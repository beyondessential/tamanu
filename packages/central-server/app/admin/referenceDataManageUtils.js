import { upperFirst } from 'es-toolkit/compat';
import {
  REFERENCE_TYPES,
  REFERENCE_TYPE_VALUES,
  MANAGEABLE_REFERENCE_DATA_TYPES,
  SUGGESTER_ENDPOINTS,
} from '@tamanu/constants';
import { DatabaseDuplicateError, InvalidOperationError } from '@tamanu/errors';

// Reference-data types whose type-specific columns live on a separate 1:1 "satellite" table —
// a `hasOne` on ReferenceData keyed by `referenceDataId` (e.g. `reference_drugs`).
// getModelForType resolves these types to the base ReferenceData model, so a satellite's columns
// only reach the Manage table when its association is joined explicitly. Single source of truth
// mapping each satellite-backed reference type to its `hasOne` association alias on ReferenceData
// (`as`) and whether Manage currently surfaces/persists its columns (`enabled`). Wiring up
// taskTemplate and medicationTemplate (plus the provisioning/importer parity they need) is the
// follow-up tracked in TAM-7046; until then the guardrail test allowlists their not-yet-surfaced
// satellite columns individually.
// `enabled` is load-bearing, not a runtime feature flag: it drives both getSatelliteForType gating
// (only enabled satellites are joined/persisted) and the guardrail test's surfaced-vs-follow-up
// split — don't drop it.
export const SATELLITE_REGISTRY = {
  [REFERENCE_TYPES.DRUG]: { as: 'referenceDrug', enabled: true },
  [REFERENCE_TYPES.TASK_TEMPLATE]: { as: 'taskTemplate', enabled: false },
  [REFERENCE_TYPES.MEDICATION_TEMPLATE]: { as: 'medicationTemplate', enabled: false },
};

// Resolve the satellite association to join for a reference type, or null when the type has
// no satellite or its satellite isn't surfaced in Manage yet. Returns the association alias
// and its target model so the caller can derive columns and eager-load/persist rows.
export const getSatelliteForType = (models, type) => {
  const entry = SATELLITE_REGISTRY[type];
  if (!entry?.enabled) return null;
  const association = models.ReferenceData.associations[entry.as];
  if (!association) return null;
  return { as: entry.as, model: association.target };
};

export const getModelForType = (models, type) => {
  if (REFERENCE_TYPE_VALUES.includes(type)) {
    return {
      model: models.ReferenceData,
      typeFilter: { type },
      satellite: getSatelliteForType(models, type),
    };
  }
  // For all other types (OTHER_REFERENCE_TYPES, clinical, system), resolve via upperFirst
  const modelName = upperFirst(type);
  const model = models[modelName];
  if (!model) {
    throw new InvalidOperationError(`No model found for type: ${type}`);
  }
  return { model, typeFilter: {}, satellite: null };
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

// Columns never shown for a satellite: its own primary key and the `referenceDataId` link
// (implied by the base row), plus the standard bookkeeping columns.
const SATELLITE_HIDDEN_COLUMNS = new Set([
  'id',
  'referenceDataId',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'updatedAtSyncTick',
]);

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

// Map a single Sequelize attribute to the base Manage column descriptor shared by base and
// satellite columns: its type, nullability and default (preferring live DB metadata, falling back
// to the model attribute), plus ENUM values. Callers layer read-only/FK/satellite flags on top.
const buildColumnDescriptor = (key, attr, dbCol) => {
  const typeName = attr.type?.constructor?.name ?? 'STRING';
  const col = {
    key,
    type: typeName,
    allowNull: dbCol ? dbCol.is_nullable === 'YES' : attr.allowNull !== false,
    hasDefault: dbCol ? dbCol.column_default != null : attr.defaultValue != null,
  };
  if (typeName === 'ENUM' && attr.type?.values) {
    col.enumValues = attr.type.values;
  }
  return col;
};

// The satellite columns Manage manages for a satellite model: every attribute except its own
// primary key, the referenceDataId link, and bookkeeping columns. Exported so the guardrail test
// checks the same set of columns the Manage table is expected to surface.
export const getSatelliteColumnKeys = satelliteModel =>
  Object.keys(satelliteModel.rawAttributes).filter(key => !SATELLITE_HIDDEN_COLUMNS.has(key));

// Build the Manage columns for a satellite table. Satellite columns are plain data columns
// (route, dosingUnit, unitConversion, …) edited/saved alongside the base row; they carry no FK
// suggesters or name companions, and are flagged so the list/write path can join and persist them.
// Assumption: hardcoding readOnly:false and skipping FK-suggester/name-companion detection is only
// valid while every enabled satellite has plain data columns (no FK columns) — ReferenceDrug does.
// A future FK-bearing satellite must revisit this to run getForeignKeySuggesters/name-companion logic.
const getSatelliteColumns = async satellite => {
  const rawAttributes = satellite.model.rawAttributes;
  const dbColumns = await getDbColumnInfo(satellite.model);
  const satelliteKeys = new Set(getSatelliteColumnKeys(satellite.model));

  return Object.entries(rawAttributes)
    .filter(([key]) => satelliteKeys.has(key))
    .map(([key, attr]) => ({
      ...buildColumnDescriptor(key, attr, dbColumns.get(attr.field ?? key)),
      readOnly: false,
      readOnlyOnEdit: false,
      isSatellite: true,
    }));
};

export const getColumnsForModel = async (model, satellite = null) => {
  const rawAttributes = model.rawAttributes ?? {};
  const fkSuggesters = getForeignKeySuggesters(model);
  const dbColumns = await getDbColumnInfo(model);

  const baseColumns = Object.entries(rawAttributes)
    .filter(([key]) => !isColumnHidden(key, model.name))
    .map(([key, attr]) => {
      const col = {
        ...buildColumnDescriptor(key, attr, dbColumns.get(attr.field ?? key)),
        readOnly: READONLY_COLUMNS[key]?.has(model.name) ?? false,
        readOnlyOnEdit: READONLY_ON_EDIT_COLUMNS.has(key),
      };
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

  // Append the satellite table's columns so they display and edit alongside the base row.
  if (satellite) {
    columns.push(...(await getSatelliteColumns(satellite)));
  }

  return columns;
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

// Partition already-writable data into the base ReferenceData row and its satellite row, using
// the satellite flag on the columns so satellite fields never get written to the base model.
export const splitSatelliteData = (columns, data) => {
  const satelliteKeys = new Set(columns.filter(c => c.isSatellite).map(c => c.key));
  const baseData = {};
  const satelliteData = {};
  for (const [key, value] of Object.entries(data)) {
    if (satelliteKeys.has(key)) satelliteData[key] = value;
    else baseData[key] = value;
  }
  return { baseData, satelliteData };
};

// Upsert a satellite row keyed by its owning reference data id (the 1:1 link). referenceDataId
// carries a unique constraint, so this is a single atomic INSERT ... ON CONFLICT (no findOrCreate
// + update race between concurrent saves for the same referenceDataId). Model.upsert derives the
// ON CONFLICT DO UPDATE set from the built instance's changed fields, which are exactly the values
// we pass here (referenceDataId + satelliteData) — columns we don't pass aren't in the update set,
// so they keep their stored value (a partial update merges, it doesn't wipe). Runs inside the
// caller's managed transaction (CLS binds it), so no transaction object is threaded through.
export const upsertSatelliteRecord = async (satelliteModel, referenceDataId, satelliteData) => {
  const [record] = await satelliteModel.upsert({ referenceDataId, ...satelliteData });
  return record;
};

// Build the single-record create/update response, shared by the POST and PUT handlers so the shape
// lives in one place. With no satellite it's just the base record. With a satellite the response
// carries the same flat shape the list route returns: satellite fields flattened onto the base row
// as top-level keys, null when the satellite row is absent (satelliteRecord null). satelliteRecord
// is the row the transaction returned (the upserted row, or the existing row when the write left the
// satellite untouched), so no extra query is needed to build this.
export const buildResponseWithSatellite = (record, columns, satellite, satelliteRecord) => {
  const row = record.forResponse();
  if (!satellite) return row;
  for (const column of columns.filter(c => c.isSatellite)) {
    row[column.key] = satelliteRecord?.[column.key] ?? null;
  }
  return row;
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
