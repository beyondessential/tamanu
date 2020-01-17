import express from 'express';
import asyncHandler from 'express-async-handler';

export const patient = express.Router();

patient.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const u = await models.Patient.findByPk(params.id);
    res.send(u);
  }),
);

patient.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const u = await models.Patient.findByPk(params.id);
    await u.update(req.body);
    res.send(u);
  }),
);

patient.post(
  '/$',
  asyncHandler(async (req, res) => {
    const { models } = req;
    const u = await models.Patient.create(req.body);

    res.send(u);
  }),
);
