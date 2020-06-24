import express from 'express';
import asyncHandler from 'express-async-handler';

import { NotFoundError } from 'shared/errors';
import { renameObjectKeys } from '~/utils/renameObjectKeys';


// utility function for creating a subroute that all checks the same
// action (for eg different relation reads on a visit all check visit.read)
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
    const { models, params } = req;
    // check the user can read this model type before searching for it
    // (otherwise, they can see if they get a "not permitted" or a
    // "not found" to snoop for objects)
    req.checkPermission('read', modelName);
    const model = models[modelName];
    const object = await model.findByPk(params.id, {
      include: model.getFullReferenceAssociations(),
    });
    if (!object) throw new NotFoundError();
    req.checkPermission('read', object);
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

