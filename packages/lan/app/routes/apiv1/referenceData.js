import express from 'express';
import asyncHandler from 'express-async-handler';

import { simpleGet, simplePut, simplePost } from './crudHelpers';

export const referenceData = express.Router();

referenceData.get('/:id', simpleGet('ReferenceData'));
referenceData.put('/:id', simplePut('ReferenceData'));
referenceData.post('/$', simplePost('ReferenceData'));

referenceData.get(
  '/$',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'ReferenceData');

    const { query } = req;
    const { type } = query;

    const records = await req.models.ReferenceData.findAll({
      where: { type },
    });

    res.send({
      data: records,
      count: records.length,
    });
  }),
);
