import asyncHandler from 'express-async-handler';

import { NotFoundError } from 'shared/errors';
import { permissionCheckingRouter, simpleGet, simpleGetList, simplePut } from '../crudHelpers';
import { renameObjectKeys } from '~/utils/renameObjectKeys';
import { getPotentialInvoiceLineItems } from './getPotentialInvoiceLineItems';

export const invoiceLineItemsRoute = permissionCheckingRouter('read', 'Invoice');

invoiceLineItemsRoute.get('/:id/invoiceLineItems', simpleGetList('InvoiceLineItem', 'invoiceId'));

invoiceLineItemsRoute.post(
  '/:id/invoiceLineItems',
  asyncHandler(async (req, res) => {
    const {
      models,
      params: { id: invoiceId },
    } = req;
    req.checkPermission('create', 'InvoiceLineItem');

    const invoiceLineItemData = req.body;
    const invoiceLineItem = await models.InvoiceLineItem.create({
      ...invoiceLineItemData,
      invoiceId,
    });
    res.send(invoiceLineItem);
  }),
);

invoiceLineItemsRoute.get('/:invoiceId/invoiceLineItems/:id', simpleGet('InvoiceLineItem'));
invoiceLineItemsRoute.put('/:invoiceId/invoiceLineItems/:id', simplePut('InvoiceLineItem'));

invoiceLineItemsRoute.delete(
  '/:id/invoiceLineItems/:invoiceLineItemId',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    req.checkPermission('read', 'InvoiceLineItem');

    const invoiceLineItemId = params.invoiceLineItemId;
    const invoiceLineItem = await models.InvoiceLineItem.findByPk(invoiceLineItemId);
    if (!invoiceLineItem) {
      throw new NotFoundError();
    }

    req.checkPermission('write', invoiceLineItem);

    await models.InvoiceLineItem.destroy({
      where: {
        id: invoiceLineItemId,
      },
    });

    res.send({ message: 'Item deleted successfully' });
  }),
);

invoiceLineItemsRoute.get(
  '/:id/potentialInvoiceLineItems',
  asyncHandler(async (req, res) => {
    const { models, params, db } = req;
    const invoiceId = params.id;
    const invoice = await models.Invoice.findByPk(invoiceId);
    const encounterId = invoice.encounterId;
    const potentialInvoiceLineItems = await getPotentialInvoiceLineItems(db, models, encounterId);
    const data = potentialInvoiceLineItems.map(x => renameObjectKeys(x.forResponse()));
    res.send({
      count: data.length,
      data,
    });
  }),
);

invoiceLineItemsRoute.post(
  '/:id/potentialInvoiceLineItems',
  asyncHandler(async (req, res) => {
    const { models, params, db } = req;
    req.checkPermission('create', 'InvoiceLineItem');

    const invoiceId = params.id;
    const invoice = await models.Invoice.findByPk(invoiceId);
    const encounterId = invoice.encounterId;
    const potentialInvoiceLineItems = await getPotentialInvoiceLineItems(db, models, encounterId);
    const items = potentialInvoiceLineItems.map(x => renameObjectKeys(x.forResponse()));

    // create actual invoice line records for the potential invoice line items
    for (const item of items) {
      await models.InvoiceLineItem.create({
        invoiceId,
        invoiceLineTypeId: item.invoiceLineTypeId,
        date: item.date,
        orderedById: item.orderedById,
        price: item.price,
      });
    }

    res.send({
      count: items.length,
      data: items,
    });
  }),
);
