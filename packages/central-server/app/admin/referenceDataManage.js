import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op, UniqueConstraintError } from 'sequelize';
import { SEARCHABLE_COLUMN_TYPES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { DatabaseDuplicateError, InvalidOperationError } from '@tamanu/errors';
import {
  getModelForType,
  getColumnsForModel,
  assertValidType,
  getWritableData,
  createMultiSelectRecords,
} from './referenceDataManageUtils';

export const referenceDataManageRouter = express.Router();

referenceDataManageRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'ReferenceData');

    const { referenceDataType, ...rawData } = req.body;

    assertValidType(referenceDataType);

    const { model, typeFilter } = getModelForType(req.store.models, referenceDataType);
    const columns = await getColumnsForModel(model);
    const data = getWritableData(columns, rawData, false);

    if (columns.some(c => c.multiSelect)) {
      const records = await createMultiSelectRecords(model, columns, data, typeFilter);
      return res.send(records);
    }

    try {
      const record = await model.create({ ...typeFilter, ...data });
      res.send(record.forResponse());
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        const field = err.errors?.[0]?.path ?? 'field';
        const value = err.errors?.[0]?.value ?? '';
        throw new DatabaseDuplicateError(`A record with ${field} "${value}" already exists`);
      }
      throw err;
    }
  }),
);

referenceDataManageRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'ReferenceData');

    const { referenceDataType, ...rawData } = req.body;
    const { id } = req.params;

    assertValidType(referenceDataType);

    const { model, typeFilter } = getModelForType(req.store.models, referenceDataType);
    const record = await model.findOne({ where: { id, ...typeFilter } });

    if (!record) {
      throw new InvalidOperationError(`Record with id "${id}" not found`);
    }

    const columns = await getColumnsForModel(model);
    const data = getWritableData(columns, rawData, true);

    await record.update(data);
    res.send(record.forResponse());
  }),
);

referenceDataManageRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'ReferenceData');

    const { id } = req.params;
    const { ReferenceDataRelation } = req.store.models;
    const record = await ReferenceDataRelation.findByPk(id);

    if (!record) {
      throw new InvalidOperationError(`Reference data relation with id "${id}" not found`);
    }

    await record.destroy();
    res.send({});
  }),
);

referenceDataManageRouter.get(
  '/columns',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'ReferenceData');
    const { referenceDataType } = req.query;
    assertValidType(referenceDataType);
    const { model } = getModelForType(req.store.models, referenceDataType);
    res.send(await getColumnsForModel(model));
  }),
);

referenceDataManageRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'ReferenceData');

    const {
      query: { referenceDataType, page = 0, rowsPerPage = 10, orderBy = 'createdAt', order = 'ASC', ...filters },
    } = req;

    assertValidType(referenceDataType);

    const { model, typeFilter } = getModelForType(req.store.models, referenceDataType);
    const columns = await getColumnsForModel(model);

    // Build search filters from query params
    const searchWhere = {};
    const searchableKeys = new Set(
      columns
        .filter(c => SEARCHABLE_COLUMN_TYPES.includes(c.type) || c.suggesterEndpoint || c.enumValues)
        .map(c => c.key),
    );

    const normalizedOrder = order.toUpperCase();
    if (!['ASC', 'DESC'].includes(normalizedOrder)) {
      throw new InvalidOperationError(`Invalid order value: ${order}`);
    }

    const validOrderByColumns = new Set(
      Object.keys(model.rawAttributes ?? {}).filter(key => key !== 'deletedAt'),
    );
    if (!validOrderByColumns.has(orderBy)) {
      throw new InvalidOperationError(`Invalid orderBy value: ${orderBy}`);
    }

    const EXACT_MATCH_TYPES = new Set(['INTEGER', 'FLOAT', 'DOUBLE', 'DECIMAL', 'REAL', 'BOOLEAN']);
    const exactMatchKeys = new Set(
      columns
        .filter(
          c =>
            c.suggesterEndpoint ||
            c.enumValues ||
            EXACT_MATCH_TYPES.has(c.type),
        )
        .map(c => c.key),
    );

    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue;
      if (key === 'availableFacilities') {
        const facilityIds = Array.isArray(value) ? value : value.split(',');
        searchWhere.availableFacilities = { [Op.contains]: facilityIds };
        continue;
      }
      if (key === 'visibilityStatus') {
        searchWhere.visibilityStatus = value.split(',');
        continue;
      }
      if (searchableKeys.has(key)) {
        searchWhere[key] = exactMatchKeys.has(key) ? value : { [Op.iLike]: `%${value}%` };
      }
    }

    // Default to current records when model has visibilityStatus and no filter was sent
    const hasVisibilityStatus = columns.some(c => c.key === 'visibilityStatus');
    if (hasVisibilityStatus && !searchWhere.visibilityStatus) {
      searchWhere.visibilityStatus = VISIBILITY_STATUSES.CURRENT;
    }

    const where = { ...typeFilter, ...searchWhere };

    const count = await model.count({ where });
    const data = await model.findAll({
      where,
      order: [[orderBy, normalizedOrder], ['id', 'ASC']],
      limit: Number(rowsPerPage),
      offset: Number(page) * Number(rowsPerPage),
    });

    res.send({
      count,
      data: data.map(record => record.forResponse()),
    });
  }),
);
