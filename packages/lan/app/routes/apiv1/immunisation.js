import express from 'express';
import asyncHandler from 'express-async-handler';

import { simplePut, simplePost } from './crudHelpers';

export const immunisation = express.Router();

immunisation.get(
  '/$',
  asyncHandler(async (req, res) => {
    const { models } = req;
    req.checkPermission('read', 'Immunisation');

    const model = models.Immunisation;
    const immunisations = await models.Immunisation.findAll({
      include: model.getListReferenceAssociations(models),
    });

    res.send({
      count: immunisations.length,
      data: immunisations,
    });
  }),
);

immunisation.put('/:id', simplePut('Immunisation'));
immunisation.post('/$', simplePost('Immunisation'));
