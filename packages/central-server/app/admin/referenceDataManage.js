import express from 'express';
import asyncHandler from 'express-async-handler';
import { upperFirst } from 'lodash';
import { Op } from 'sequelize';
import {
  REFERENCE_TYPE_VALUES,
  OTHER_REFERENCE_TYPE_VALUES,
  GENERAL_IMPORTABLE_DATA_TYPES,
  SUGGESTER_ENDPOINTS,
  SEARCHABLE_COLUMN_TYPES,
} from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/errors';

export const referenceDataManageRouter = express.Router();

const getModelForType = (models, type) => {
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

const getColumnsForModel = (model) => {
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

const getUniqueFields = (model) => {
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

const assertValidType = (type) => {
  if (!type) {
    throw new InvalidOperationError('type is required in request body');
  }

  if (!MANAGEABLE_REFERENCE_DATA_TYPES.includes(type)) {
    throw new InvalidOperationError(`Invalid reference data type: ${type}`);
  }
};

const getWritableData = (columns, data, isEditMode) => {
  const writableKeys = new Set(
    columns.filter((c) => !c.readOnly && !(isEditMode && c.readOnlyOnEdit)).map((c) => c.key),
  );
  return Object.fromEntries(Object.entries(data).filter(([key]) => writableKeys.has(key)));
};

referenceDataManageRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'ReferenceData');

    const { type, ...rawData } = req.body;

    assertValidType(type);

    const { model, typeFilter } = getModelForType(req.store.models, type);
    const columns = getColumnsForModel(model);
    const data = getWritableData(columns, rawData, false);

    // Check single-column unique fields for conflicts
    const uniqueFields = getUniqueFields(model);
    for (const field of uniqueFields) {
      if (data[field] == null) continue;
      const conflict = await model.findOne({
        where: { [field]: data[field], ...typeFilter },
        paranoid: false,
      });
      if (conflict) {
        throw new InvalidOperationError(
          `A record with ${field} "${data[field]}" already exists`,
        );
      }
    }

    const record = await model.create({ ...typeFilter, ...data });
    res.send(record.forResponse());
  }),
);

referenceDataManageRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'ReferenceData');

    const { type, ...rawData } = req.body;
    const { id } = req.params;

    assertValidType(type);

    const { model, typeFilter } = getModelForType(req.store.models, type);
    const record = await model.findOne({ where: { id, ...typeFilter } });

    if (!record) {
      throw new InvalidOperationError(`Record with id "${id}" not found`);
    }

    const columns = getColumnsForModel(model);
    const data = getWritableData(columns, rawData, true);

    await record.update(data);
    res.send(record.forResponse());
  }),
);

referenceDataManageRouter.get(
  '/columns',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'ReferenceData');
    const { type } = req.query;
    assertValidType(type);
    const { model } = getModelForType(req.store.models, type);
    res.send(getColumnsForModel(model));
  }),
);

referenceDataManageRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'ReferenceData');

    const {
      query: { type, page = 0, rowsPerPage = 10, orderBy = 'createdAt', order = 'ASC', ...filters },
    } = req;

    assertValidType(type);

    const { model, typeFilter } = getModelForType(req.store.models, type);
    const columns = getColumnsForModel(model);

    // Build search filters from query params
    const searchWhere = {};
    const columnKeys = columns.map((c) => c.key);
    const stringColumnKeys = new Set(
      columns.filter((c) => SEARCHABLE_COLUMN_TYPES.includes(c.type)).map((c) => c.key),
    );

    if (!columnKeys.includes(orderBy)) {
      throw new InvalidOperationError(`Invalid orderBy value: ${orderBy}`);
    }

    const normalizedOrder = order.toUpperCase();
    if (!['ASC', 'DESC'].includes(normalizedOrder)) {
      throw new InvalidOperationError(`Invalid order value: ${order}`);
    }

    for (const [key, value] of Object.entries(filters)) {
      if (stringColumnKeys.has(key) && value) {
        searchWhere[key] = { [Op.iLike]: `%${value}%` };
      }
    }

    const where = { ...typeFilter, ...searchWhere };

    const count = await model.count({ where });
    const data = await model.findAll({
      where,
      order: [[orderBy, normalizedOrder]],
      limit: Number(rowsPerPage),
      offset: Number(page) * Number(rowsPerPage),
    });

    res.send({
      count,
      data: data.map((record) => record.forResponse()),
    });
  }),
);
