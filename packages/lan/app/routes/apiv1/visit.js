import express from 'express';
import asyncHandler from 'express-async-handler';

export const visit = express.Router();

visit.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const u = await models.Visit.findByPk(params.id);
    res.send(u);
  }),
);

visit.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const u = await models.Visit.findByPk(params.id);
    await u.update(req.body);
    res.send(u);
  }),
);

visit.post(
  '/$',
  asyncHandler(async (req, res) => {
    const { models } = req;
    const u = await models.Visit.create(req.body);

    res.send(u);
  }),
);
