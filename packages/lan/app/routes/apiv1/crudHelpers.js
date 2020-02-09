import asyncHandler from 'express-async-handler';

import { NotFoundError } from 'lan/app/errors';

export const simpleGet = modelName =>
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const model = models[modelName];
    const object = await model.findByPk(params.id, {
      include: model.getEagerAssociations(),
    });
    req.checkPermission('read', object);
    if (!object) throw new NotFoundError();
    res.send(object);
  });

export const simplePut = modelName =>
  asyncHandler(async (req, res) => {
    const { models, params } = req;
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
    req.checkPermission('list', modelName);

    const model = models[modelName];
    const objects = await models[modelName].findAll({
      where: {
        ...(foreignKey && { [foreignKey]: params.id }),
        ...additionalFilters,
      },
      order,
      limit,
      offset,
      include: model.getEagerAssociations(models),
    });

    res.send(objects);
  });
};
