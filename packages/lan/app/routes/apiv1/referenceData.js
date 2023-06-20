import express from 'express';
import asyncHandler from 'express-async-handler';

import { simpleGet, simplePut, simplePost } from './crudHelpers';

export const referenceData = express.Router();

referenceData.get(
  '/:type/all',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'ReferenceData');
    const {
      models,
      params: { type },
    } = req;
    const data = await models.ReferenceData.findAll({
      where: { type },
    });
    res.send({
      count: data.length,
      data,
    });
  }),
);

referenceData.get('/:id', simpleGet('ReferenceData'));
referenceData.put('/:id', simplePut('ReferenceData'));
referenceData.post('/$', simplePost('ReferenceData'));
