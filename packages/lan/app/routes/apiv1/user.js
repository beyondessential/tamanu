import express from 'express';
import asyncHandler from 'express-async-handler';

import { NotFoundError } from 'Lan/app/errors';

export const user = express.Router();

user.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const u = await models.User.findByPk(params.id);
    if(!u) return new NotFoundError();
    res.send(u);
  }),
);

user.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const u = await models.User.findByPk(params.id);
    if(!u) return new NotFoundError();
    await u.update(req.body);
    res.send(u);
  }),
);

user.post(
  '/$',
  asyncHandler(async (req, res) => {
    const { models } = req;
    const { password, ...details } = req.body;
    const u = await models.User.build(details);
    if (password) {
      await u.setPassword(password);
    }
    await u.save();

    res.send(u);
  }),
);
