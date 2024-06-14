import express from 'express';
import asyncHandler from 'express-async-handler';
import { NotFoundError } from '@tamanu/shared/errors';

export const invoiceProducts = express.Router();

invoiceProducts.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const model = models['InvoiceProduct'];
    req.checkPermission('read', 'Invoice');

    const object = await model.findByPk(params.id, {
      include: model.getFullReferenceAssociations(),
    });
    if (!object) throw new NotFoundError();

    res.send(object);
  }),
);
