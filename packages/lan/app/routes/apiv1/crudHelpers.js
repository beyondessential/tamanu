import { transform } from '@babel/core';
import express from 'express';
import asyncHandler from 'express-async-handler';

import { QueryTypes } from 'sequelize';

import { NotFoundError } from 'shared/errors';
import { renameObjectKeys } from '~/utils/renameObjectKeys';

// utility function for creating a subroute that all checks the same
// action (for eg different relation reads on an encounter all check encounter.read)
export const permissionCheckingRouter = (action, subject) => {
  const router = express.Router();

  router.use((req, res, next) => {
    req.checkPermission(action, subject);
    next();
  });

  return router;
};

export const findRouteObject = async (req, modelName) => {
  const { models, params } = req;
  const model = models[modelName];
  // check the user can read this model type before searching for it
  // (otherwise, they can see if they get a "not permitted" or a
  // "not found" to snoop for objects)
  req.checkPermission('read', modelName);
  const object = await model.findByPk(params.id, {
    include: model.getFullReferenceAssociations(),
  });
  if (!object) throw new NotFoundError();
  req.checkPermission('read', object);
  return object;
};

export const simpleGet = modelName =>
  asyncHandler(async (req, res) => {
    const object = await findRouteObject(req, modelName);
    res.send(object);
  });

export const simplePut = modelName =>
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    req.checkPermission('read', modelName);
    const object = await models[modelName].findByPk(params.id);
    if (!object) throw new NotFoundError();
    req.checkPermission('write', object);
    await object.update(req.body);
    res.send(object);
  });

export const simplePost = modelName =>
  asyncHandler(async (req, res) => {
    const { models } = req;
    req.checkPermission('create', modelName);
    const object = await models[modelName].create(req.body);
    res.send(object);
  });

// transformer format:
// filterParams => value
// (a new filterParam will be created with value)
// NOTE: query is always going to come in as strings, has to be parsed manually in each transformer function

export const simpleList = (modelName, options) =>
  asyncHandler(async (req, res) => {
    const { models, query } = req;
    const { defaults, filters, transforms, sortKeys, joinClause, additionalSelectClause } = options;

    req.checkPermission('list', modelName);

    const {
      orderBy = defaults.orderBy,
      order = 'asc',
      rowsPerPage = 10,
      page = 0,
      ...filterParams
    } = query;

    const sortKey = sortKeys[orderBy];
    const sortDirection = order.toUpperCase();

    const whereClauses = Object.entries(filters).filter(([param, _]) => filterParams[param]).map(([_, filterSql]) => filterSql).join(' AND ');

    const from = `
      FROM ${modelName}
      ${joinClause}
      ${whereClauses && `WHERE ${whereClauses}`}
    `;

    const filterReplacements = Object.entries(transforms)
      .reduce(
        (current, [paramName, transform]) => ({
          ...current,
          [paramName]: transform(current),
        }),
        filterParams,
      );

    const countResult = await req.db.query(`SELECT COUNT(1) AS count ${from}`, {
      replacements: filterReplacements,
      type: QueryTypes.SELECT,
    });

    const { count } = countResult[0];

    if (count === 0) {
      // save ourselves a query
      res.send({ data: [], count });
      return;
    }

    const result = await req.db.query(
      `
        SELECT patients.* ${additionalSelectClause ? ',' : ''}
        ${additionalSelectClause}
        ${from}
        
        ORDER BY ${sortKey} ${sortDirection} NULLS LAST
        LIMIT :limit
        OFFSET :offset
      `,
      {
        replacements: {
          ...filterReplacements,
          limit: rowsPerPage,
          offset: page * rowsPerPage,
        },
        model: models[modelName],
        type: QueryTypes.SELECT,
        mapToModel: true,
      },
    );

    const forResponse = result.map(x => renameObjectKeys(x.forResponse()));

    res.send({
      data: forResponse,
      count,
    });
  });

export const simpleGetList = (modelName, foreignKey = '', options = {}) => {
  const { additionalFilters = {}, include = [] } = options;

  return asyncHandler(async (req, res) => {
    const { models, params, query } = req;
    const { offset = 0, order = 'ASC', orderBy, rowsPerPage = 10 } = query;

    const model = models[modelName];
    const associations = model.getListReferenceAssociations(models) || [];
    const objects = await models[modelName].findAll({
      where: {
        ...(foreignKey && { [foreignKey]: params.id }),
        ...additionalFilters,
      },
      order: orderBy ? [[orderBy, order.toUpperCase()]] : undefined,
      limit: rowsPerPage,
      offset,
      include: [...associations, ...include],
    });

    const data = objects.map(x => x.forResponse());

    res.send({
      count: data.length,
      data: data,
    });
  });
};

export async function runPaginatedQuery(db, model, countQuery, selectQuery, params, pagination) {
  const countResult = await db.query(countQuery, {
    replacements: params,
    type: QueryTypes.SELECT,
  });

  const count = countResult[0].count;
  if (count === 0) {
    return {
      data: [],
      count: 0,
    };
  }

  const { page = 0, rowsPerPage = 10 } = pagination;

  const result = await db.query(`${selectQuery} LIMIT :limit OFFSET :offset`, {
    replacements: {
      ...params,
      limit: rowsPerPage,
      offset: page * rowsPerPage,
    },
    model: model,
    type: QueryTypes.SELECT,
    mapToModel: true,
  });

  const forResponse = result.map(x => renameObjectKeys(x.forResponse()));
  return {
    count,
    data: forResponse,
  };
}
