import express from 'express';
import asyncHandler from 'express-async-handler';

import { NotFoundError } from 'shared/errors';

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

export const simpleGet = modelName =>
  asyncHandler(async (req, res) => {
    const object = await req.findRouteObject(modelName);
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

export const simpleGetList = (modelName, foreignKey = '', options = {}) => {
  const { order, additionalFilters = {} } = options;

  return asyncHandler(async (req, res) => {
    const { models, params, query } = req;
    const { limit = 10, offset = 0 } = query;

    const model = models[modelName];
    const objects = await models[modelName].findAll({
      where: {
        ...(foreignKey && { [foreignKey]: params.id }),
        ...additionalFilters,
      },
      order,
      limit,
      offset,
      include: model.getListReferenceAssociations(models),
    });

    const data = objects.map(x => x.forResponse());

    res.send({
      count: data.length,
      data: data,
    });
  });
};
