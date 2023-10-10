import express from 'express';
import asyncHandler from 'express-async-handler';

import { QueryTypes } from 'sequelize';

import { NotFoundError } from '../errors';
import { renameObjectKeys } from './renameObjectKeys';

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

export const simpleGetHasOne = (modelName, foreignKey, options = {}) =>
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const model = models[modelName];
    const { additionalFilters = {} } = options;
    req.checkPermission('read', modelName);
    const object = await model.findOne({
      where: { [foreignKey]: params.id, ...additionalFilters },
      include: model.getFullReferenceAssociations(),
    });
    if (!object) throw new NotFoundError();

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

export const getResourceList = async (req, modelName, foreignKey = '', options = {}) => {
  const { models, params, query } = req;
  const { order = 'ASC', orderBy = 'createdAt', rowsPerPage, page } = query;
  const { additionalFilters = {}, include = [], skipPermissionCheck = false } = options;

  if (skipPermissionCheck === false) {
    req.checkPermission('list', modelName);
  }

  const model = models[modelName];
  const associations = model.getListReferenceAssociations(models) || [];

  const baseQueryOptions = {
    where: {
      ...(foreignKey && { [foreignKey]: params.id }),
      ...(typeof additionalFilters === 'function' ? additionalFilters(req) : additionalFilters),
    },
    // ['association', 'column', 'direction'] is the sequlize format to sort by foreign column
    // allow 'association.column' as a valid sort query
    order: orderBy ? [[...orderBy.split('.'), order.toUpperCase()]] : undefined,
    include: [...associations, ...include],
  };

  const count = await models[modelName].count({
    ...baseQueryOptions,
    distinct: true,
  });

  const objects = await models[modelName].findAll({
    ...baseQueryOptions,
    limit: rowsPerPage,
    offset: page && rowsPerPage ? page * rowsPerPage : undefined,
  });

  const data = objects.map(x => x.forResponse());

  return { count, data };
};

export const simpleGetList = (modelName, foreignKey = '', options = {}) =>
  asyncHandler(async (req, res) => {
    const response = await getResourceList(req, modelName, foreignKey, options);

    res.send(response);
  });

export const paginatedGetList = (modelName, foreignKey = '', options = {}) => {
  const { additionalFilters = {}, include = [], skipPermissionCheck = false } = options;

  return asyncHandler(async (req, res) => {
    const { models, params, query } = req;
    const { page = 0, order = 'ASC', orderBy, rowsPerPage } = query;
    const offset = query.offset || page * rowsPerPage || 0;

    if (skipPermissionCheck === false) {
      req.checkPermission('list', modelName);
    }

    const model = models[modelName];
    const associations = model.getListReferenceAssociations(models) || [];

    const queryOpts = {
      where: {
        ...(foreignKey && { [foreignKey]: params.id }),
        ...additionalFilters,
      },
      include: [...associations, ...include],
    };

    const resultsToCount = await models[modelName].findAll(queryOpts);
    const count = resultsToCount.length;
    // Exit early if there are no results
    if (count === 0) {
      res.send({ count, data: [] });
      return;
    }

    const objects = await models[modelName].findAll({
      ...queryOpts,
      // ['association', 'column', 'direction'] is the sequlize format to sort by foreign column
      // allow 'association.column' as a valid sort query
      order: orderBy ? [[...orderBy.split('.'), order.toUpperCase()]] : undefined,
      limit: rowsPerPage || undefined,
      offset,
    });

    const data = objects.map(x => x.forResponse());

    res.send({
      count: resultsToCount.length,
      data,
    });
  });
};
export async function runPaginatedQuery(db, model, countQuery, selectQuery, params, pagination) {
  const countResult = await db.query(countQuery, {
    replacements: params,
    type: QueryTypes.SELECT,
  });

  const { count } = countResult[0];
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
    model,
    type: QueryTypes.SELECT,
    mapToModel: true,
  });

  const forResponse = result.map(x => renameObjectKeys(x.forResponse()));
  return {
    count,
    data: forResponse,
  };
}
