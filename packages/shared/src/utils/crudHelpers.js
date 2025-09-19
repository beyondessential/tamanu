import express from 'express';
import asyncHandler from 'express-async-handler';

import { QueryTypes } from 'sequelize';

import { InvalidOperationError, NotFoundError } from '@tamanu/errors';
import { renameObjectKeys } from '@tamanu/utils/renameObjectKeys';

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

export const softDeletionCheckingRouter = (tableName) => {
  const router = express.Router();

  router.use(async (req, res, next) => {
    const { models, body, params } = req;
    const id = params.id || body.id;
    if (!id) {
      next();
      return;
    }
    const object = await models[tableName].findByPk(id, { paranoid: false });
    if (object && object.deletedAt) {
      throw new InvalidOperationError(
        `Invalid Operation Error: Cannot update a deleted ${tableName}, id: ${id}.`,
      );
    }
  });

  return router;
};

export const findRouteObject = async (req, modelName, options = {}) => {
  const { models, params } = req;
  const { additionalFilters = {} } = options;
  const model = models[modelName];
  // check the user can read this model type before searching for it
  // (otherwise, they can see if they get a "not permitted" or a
  // "not found" to snoop for objects)
  req.checkPermission('read', modelName);
  const object = await model.findByPk(params.id, {
    include: model.getFullReferenceAssociations(),
    where: { ...additionalFilters },
  });
  if (!object) throw new NotFoundError();
  req.checkPermission('read', object);
  return object;
};

export const simpleGet = (modelName, options = {}) =>
  asyncHandler(async (req, res) => {
    const { auditAccess = false } = options;
    const { models, params, query } = req;

    const object = await findRouteObject(req, modelName);

    if (auditAccess && object) {
      await req.audit.access({
        recordId: object.id,
        frontEndContext: params,
        model: models[modelName],
        facilityId: query.facilityId,
      });
    }

    res.send(object);
  });

export const simpleGetHasOne = (modelName, foreignKey, options = {}, transform = undefined) =>
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const model = models[modelName];
    const { additionalFilters = {}, auditAccess = false } = options;
    req.checkPermission('read', modelName);
    const object = await model.findOne({
      where: { [foreignKey]: params.id, ...additionalFilters },
      include: model.getFullReferenceAssociations(),
    });
    if (!object) throw new NotFoundError();

    if (auditAccess && object) {
      await req.audit.access({
        recordId: object.id,
        frontEndContext: params,
        model: models[modelName],
      });
    }

    res.send(transform ? transform(object) : object);
  });

export const simplePut = (modelName) =>
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    req.checkPermission('read', modelName);
    const object = await models[modelName].findByPk(params.id);
    if (!object) throw new NotFoundError();
    if (object.deletedAt)
      throw new InvalidOperationError(
        `Cannot update deleted object with id (${params.id}), you need to restore it first`,
      );
    if (Object.prototype.hasOwnProperty.call(req.body, 'deletedAt'))
      throw new InvalidOperationError('Cannot update deletedAt field');
    req.checkPermission('write', object);
    await object.update(req.body);
    res.send(object);
  });

export const simplePost = (modelName, options = {}) =>
  asyncHandler(async (req, res) => {
    const { models } = req;
    const { skipPermissionCheck = false } = options;
    if (skipPermissionCheck === false) {
      req.checkPermission('create', modelName);
    }

    const existingObject = await models[modelName].findByPk(req.body.id, {
      paranoid: false,
    });
    if (existingObject) {
      throw new InvalidOperationError(
        `Cannot create object with id (${req.body.id}), it already exists`,
      );
    }

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
      ...additionalFilters,
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

  const data = objects.map((x) => x.forResponse());

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

    const data = objects.map((x) => x.forResponse());

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

  const forResponse = result.map((x) => renameObjectKeys(x.forResponse()));
  return {
    count,
    data: forResponse,
  };
}
