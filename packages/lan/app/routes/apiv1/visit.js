import express from 'express';
import asyncHandler from 'express-async-handler';

import { NotFoundError } from 'Lan/app/errors';

export const visit = express.Router();

visit.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const v = await models.Visit.findByPk(params.id);
    if (!v) throw new NotFoundError();
    res.send(v);
  }),
);

visit.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const v = await models.Visit.findByPk(params.id);
    if (!v) throw new NotFoundError();
    await v.update(req.body);
    res.send(v);
  }),
);

visit.post(
  '/$',
  asyncHandler(async (req, res) => {
    const { models } = req;
    const v = await models.Visit.create(req.body);

    res.send(v);
  }),
);
