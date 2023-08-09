import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import { NotFoundError } from 'shared/errors';
import { INVOICE_LINE_ITEM_STATUSES } from 'shared/constants';
import {
  permissionCheckingRouter,
  simpleGet,
  simpleGetList,
  simplePut,
} from 'shared/utils/crudHelpers';
import { renameObjectKeys } from 'shared/utils';
import { getPotentialInvoiceLineItems } from './getPotentialInvoiceLineItems';

export const invoiceLineItemsRoute = permissionCheckingRouter('read', 'Invoice');

invoiceLineItemsRoute.get(
  '/:id/lineItems',
  simpleGetList('InvoiceLineItem', 'invoiceId', {
    additionalFilters: {
      status: {
        [Op.ne]: INVOICE_LINE_ITEM_STATUSES.DELETED,
      },
    },
  }),
);

invoiceLineItemsRoute.post(
  '/:invoiceId/lineItems',
  asyncHandler(async (req, res) => {
    const {
      models,
      params: { invoiceId },
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

invoiceLineItemsRoute.get('/:invoiceId/lineItems/:id', simpleGet('InvoiceLineItem'));
invoiceLineItemsRoute.put('/:invoiceId/lineItems/:id', simplePut('InvoiceLineItem'));

invoiceLineItemsRoute.delete(
  '/:invoiceId/lineItems/:id',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    req.checkPermission('read', 'InvoiceLineItem');

    const { id } = params;
    const invoiceLineItem = await models.InvoiceLineItem.findByPk(id);
    if (!invoiceLineItem) {
      throw new NotFoundError();
    }

    req.checkPermission('write', invoiceLineItem);

    await invoiceLineItem.update({
      status: INVOICE_LINE_ITEM_STATUSES.DELETED,
    });

    res.send({ message: 'Line item deleted successfully' });
  }),
);

invoiceLineItemsRoute.get(
  '/:invoiceId/potentialLineItems',
  asyncHandler(async (req, res) => {
    const { models, params, db, getLocalisation } = req;
    const { invoiceId } = params;
    const invoice = await models.Invoice.findByPk(invoiceId);
    const { encounterId } = invoice;
    const localisation = await getLocalisation();
    const { imagingTypes } = localisation;
    const potentialInvoiceLineItems = await getPotentialInvoiceLineItems(
      db,
      models,
      encounterId,
      imagingTypes,
    );
    const data = potentialInvoiceLineItems.map(x => renameObjectKeys(x.forResponse()));
    res.send({
      count: data.length,
      data,
    });
  }),
);

invoiceLineItemsRoute.post(
  '/:invoiceId/potentialLineItems',
  asyncHandler(async (req, res) => {
    const { models, params, db, getLocalisation } = req;
    req.checkPermission('create', 'InvoiceLineItem');

    const { invoiceId } = params;
    const invoice = await models.Invoice.findByPk(invoiceId);
    const { encounterId } = invoice;
    const localisation = await getLocalisation();
    const { imagingTypes } = localisation;
    const potentialInvoiceLineItems = await getPotentialInvoiceLineItems(
      db,
      models,
      encounterId,
      imagingTypes,
    );
    const items = potentialInvoiceLineItems.map(x => renameObjectKeys(x.forResponse()));

    // create actual invoice line records for the potential invoice line items
    for (const item of items) {
      await models.InvoiceLineItem.create({
        invoiceId,
        invoiceLineTypeId: item.invoiceLineTypeId,
        dateGenerated: item.date,
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
