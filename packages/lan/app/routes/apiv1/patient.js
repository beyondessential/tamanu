import express from 'express';
import asyncHandler from 'express-async-handler';

import { NotFoundError } from 'Lan/app/errors';

export const patient = express.Router();

patient.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const p = await models.Patient.findByPk(params.id);
    if(!p) return NotFoundError();
    res.send(p);
  }),
);

patient.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const p = await models.Patient.findByPk(params.id);
    if(!p) return NotFoundError();
    await p.update(req.body);
    res.send(p);
  }),
);

patient.post(
  '/$',
  asyncHandler(async (req, res) => {
    const { models } = req;
    const p = await models.Patient.create(req.body);

    res.send(p);
  }),
);
