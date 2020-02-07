import asyncHandler from 'express-async-handler';

import { NotFoundError } from 'lan/app/errors';

export const simpleGet = modelName =>
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    // check the user can read this model type before searching for it
    // (otherwise, they can see if they get a "not permitted" or a 
    // "not found" to snoop for objects)
    req.checkPermission('read', modelName);
    const object = await models[modelName].findByPk(params.id);
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

export const simpleGetList = (
  modelName,
  foreignKey = '',
  order = undefined,
  additionalFilters = {},
) =>
  asyncHandler(async (req, res) => {
    const { models, params, query } = req;
    const { limit = 10, offset = 0 } = query;
    req.checkPermission('list', modelName);

    const objects = await models[modelName].findAll({
      where: {
        ...(foreignKey && { [foreignKey]: params.id }),
        ...additionalFilters,
      },
      order,
      limit,
      offset,
    });
    res.send(objects);
  });
