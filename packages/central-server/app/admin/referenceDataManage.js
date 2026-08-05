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
  splitSatelliteData,
  upsertSatelliteRecord,
} from './referenceDataManageUtils';

export const referenceDataManageRouter = express.Router();

referenceDataManageRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'ReferenceData');

    const { referenceDataType, ...rawData } = req.body;

    assertValidType(referenceDataType);

    const { model, typeFilter, satellite } = getModelForType(req.store.models, referenceDataType);
    const columns = await getColumnsForModel(model, satellite);
    const data = getWritableData(columns, rawData, false);
    const { baseData, satelliteData } = splitSatelliteData(columns, data);

    try {
      // multiSelect is only ever set on ReferenceDataRelation.referenceDataId (see
      // MULTI_SELECT_FK_COLUMNS), and that type has no satellite — so this branch is never
      // reached by a satellite-backed type, and passing the unpartitioned `data` cannot leak
      // satellite keys today. If a satellite-backed type ever becomes multiSelect, this branch
      // must switch to `baseData` (or handle the satellite) before the base/satellite split is
      // bypassed.
      if (columns.some(c => c.multiSelect)) {
        const records = await createMultiSelectRecords(model, columns, data, typeFilter);
        return res.send(records);
      }

      const record = await model.sequelize.transaction(async () => {
        const created = await model.create({ ...typeFilter, ...baseData });
        if (satellite && Object.keys(satelliteData).length > 0) {
          await upsertSatelliteRecord(satellite.model, created.id, satelliteData);
        }
        return created;
      });
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

    const { model, typeFilter, satellite } = getModelForType(req.store.models, referenceDataType);
    const record = await model.findOne({ where: { id, ...typeFilter } });

    if (!record) {
      throw new InvalidOperationError(`Record with id "${id}" not found`);
    }

    const columns = await getColumnsForModel(model, satellite);
    const data = getWritableData(columns, rawData, true);
    const { baseData, satelliteData } = splitSatelliteData(columns, data);

    await model.sequelize.transaction(async () => {
      await record.update(baseData);
      if (satellite && Object.keys(satelliteData).length > 0) {
        await upsertSatelliteRecord(satellite.model, record.id, satelliteData);
      }
    });
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
    const { model, satellite } = getModelForType(req.store.models, referenceDataType);
    res.send(await getColumnsForModel(model, satellite));
  }),
);

referenceDataManageRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'ReferenceData');

    const {
      query: {
        referenceDataType,
        page = 0,
        rowsPerPage = 10,
        orderBy = 'createdAt',
        order = 'ASC',
        ...filters
      },
    } = req;

    assertValidType(referenceDataType);

    const { model, typeFilter, satellite } = getModelForType(req.store.models, referenceDataType);
    const columns = await getColumnsForModel(model, satellite);

    // Read-only companion columns that surface each FK's associated name (see getColumnsForModel).
    // The list query eager-loads those associations so the name can be displayed in the row.
    const fkNameColumns = columns.filter(c => c.isFkName);
    const fkNameByKey = new Map(fkNameColumns.map(c => [c.key, c]));
    const include = fkNameColumns.map(c => ({
      association: c.key,
      attributes: ['id', 'name'],
      required: false,
    }));

    // Satellite columns live on a 1:1 companion table; eager-load it so its columns can be
    // displayed and searched on the row (searched via the `$alias.column$` path syntax below).
    const satelliteColumns = columns.filter(c => c.isSatellite);
    const satelliteByKey = new Map(satelliteColumns.map(c => [c.key, c]));
    if (satellite) {
      include.push({ association: satellite.as, required: false });
    }

    // Build search filters from query params
    const searchWhere = {};
    const searchableKeys = new Set(
      columns
        .filter(
          c => SEARCHABLE_COLUMN_TYPES.includes(c.type) || c.suggesterEndpoint || c.enumValues,
        )
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
        .filter(c => c.suggesterEndpoint || c.enumValues || EXACT_MATCH_TYPES.has(c.type))
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
      const fkNameCol = fkNameByKey.get(key);
      if (fkNameCol) {
        // search the associated record's name, not a column on this model
        searchWhere[`$${fkNameCol.key}.name$`] = { [Op.iLike]: `%${value}%` };
        continue;
      }
      const satelliteCol = satelliteByKey.get(key);
      if (satelliteCol) {
        // search the satellite's column via the joined association, not a column on this model
        searchWhere[`$${satellite.as}.${key}$`] = exactMatchKeys.has(key)
          ? value
          : { [Op.iLike]: `%${value}%` };
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

    // count() only needs the joins a filter actually references (via a `$alias.column$` path);
    // the rest are display-only and would add pointless LEFT JOINs to the count query. findAll
    // keeps them all so every companion/satellite column can be populated in the response.
    const referencedAssociations = new Set(
      Object.keys(searchWhere)
        .filter(key => key.startsWith('$') && key.endsWith('$'))
        .map(key => key.slice(1, -1).split('.')[0]),
    );
    const countInclude = include.filter(({ association }) =>
      referencedAssociations.has(association),
    );

    const count = await model.count({ where, include: countInclude });
    const data = await model.findAll({
      where,
      include,
      order: [
        [orderBy, normalizedOrder],
        ['id', 'ASC'],
      ],
      limit: Number(rowsPerPage),
      offset: Number(page) * Number(rowsPerPage),
    });

    res.send({
      count,
      data: data.map(record => {
        const row = record.forResponse();
        for (const c of fkNameColumns) {
          row[c.key] = record[c.key]?.name ?? null;
        }
        if (satellite) {
          const satelliteRecord = record[satellite.as];
          for (const c of satelliteColumns) {
            row[c.key] = satelliteRecord?.[c.key] ?? null;
          }
          // drop the nested association object forResponse may have carried through
          delete row[satellite.as];
        }
        return row;
      }),
    });
  }),
);
