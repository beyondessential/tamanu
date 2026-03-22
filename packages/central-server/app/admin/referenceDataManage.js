import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import { SEARCHABLE_COLUMN_TYPES } from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/errors';
import {
  getModelForType,
  getColumnsForModel,
  getUniqueFields,
  assertValidType,
  getWritableData,
} from './referenceDataManageUtils';

export const referenceDataManageRouter = express.Router();

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
