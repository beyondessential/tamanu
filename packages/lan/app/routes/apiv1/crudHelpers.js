import express from 'express';
import asyncHandler from 'express-async-handler';

import { NotFoundError } from 'Lan/app/errors';

export const simpleGet = modelName =>
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const object = await models[modelName].findByPk(params.id);
    if (!object) throw new NotFoundError();
    res.send(object);
  });

export const simplePut = modelName =>
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const object = await models[modelName].findByPk(params.id);
    if (!object) throw new NotFoundError();
    await object.update(req.body);
    res.send(object);
  });

export const simplePost = modelName =>
  asyncHandler(async (req, res) => {
    const { models } = req;
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
    const { models, params } = req;
    // TODO: limit param
    const limit = 10;
    // TODO: pagination param
    const offset = 0;
    const order = undefined;
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
