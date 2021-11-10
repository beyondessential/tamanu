import express from 'express';
import asyncHandler from 'express-async-handler';
import { simplePut } from '../crudHelpers';

import { invoiceLineItemsRoute } from './invoiceLineItems';
import { invoicePriceChangeItemsRoute } from './invoicePriceChangeItems';

const invoiceRoute = express.Router();
export { invoiceRoute as invoices };

invoiceRoute.get(
  '/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Invoice');

    const { models, params } = req;
    const invoiceId = params.id;
    const invoice = await models.Invoice.findOne({
      include: [
        {
          model: models.Encounter,
          as: 'encounter',
        },
      ],
      where: { id: invoiceId },
    });

    req.checkPermission('read', invoice);

    res.send(invoice);
  }),
);

invoiceRoute.put('/:id', simplePut('Invoice'));

invoiceRoute.use(invoiceLineItemsRoute);
invoiceRoute.use(invoicePriceChangeItemsRoute);
