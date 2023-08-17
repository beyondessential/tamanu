import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import { INVOICE_PRICE_CHANGE_ITEM_STATUSES } from '@tamanu/constants';
import { NotFoundError } from 'shared/errors';
import { permissionCheckingRouter, simpleGetList } from 'shared/utils/crudHelpers';

export const invoicePriceChangeItemsRoute = permissionCheckingRouter('read', 'Invoice');

invoicePriceChangeItemsRoute.get(
  '/:id/priceChangeItems',
  simpleGetList('InvoicePriceChangeItem', 'invoiceId', {
    additionalFilters: {
      status: {
        [Op.ne]: INVOICE_PRICE_CHANGE_ITEM_STATUSES.DELETED,
      },
    },
  }),
);

invoicePriceChangeItemsRoute.post(
  '/:id/priceChangeItems',
  asyncHandler(async (req, res) => {
    const {
      models,
      params: { id: invoiceId },
    } = req;
    req.checkPermission('create', 'InvoicePriceChangeItem');

    const invoicePriceChangeItemData = req.body;
    const invoicePriceChangeItem = await models.InvoicePriceChangeItem.create({
      ...invoicePriceChangeItemData,
      invoiceId,
    });
    res.send(invoicePriceChangeItem);
  }),
);

invoicePriceChangeItemsRoute.get(
  '/:id/priceChangeItems/:priceChangeItemId',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    req.checkPermission('read', 'InvoicePriceChangeItem');

    const { priceChangeItemId } = params;
    const invoicePriceChangeItem = await models.InvoicePriceChangeItem.findByPk(priceChangeItemId);

    req.checkPermission('read', invoicePriceChangeItem);

    res.send(invoicePriceChangeItem);
  }),
);

invoicePriceChangeItemsRoute.put(
  '/:id/priceChangeItems/:priceChangeItemId',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    req.checkPermission('write', 'InvoicePriceChangeItem');

    const priceChangeItemId = { params };
    const invoicePriceChangeItem = await models.InvoicePriceChangeItem.findByPk(priceChangeItemId);
    if (!invoicePriceChangeItem) {
      throw new NotFoundError();
    }
    req.checkPermission('write', invoicePriceChangeItem);

    await invoicePriceChangeItem.update(req.body);

    res.send(invoicePriceChangeItem);
  }),
);

invoicePriceChangeItemsRoute.delete(
  '/:id/priceChangeItems/:priceChangeItemId',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    req.checkPermission('write', 'InvoicePriceChangeItem');

    const priceChangeItemId = { params };
    const invoicePriceChangeItem = await models.InvoicePriceChangeItem.findByPk(priceChangeItemId);
    if (!invoicePriceChangeItem) {
      throw new NotFoundError();
    }
    req.checkPermission('write', invoicePriceChangeItem);

    await invoicePriceChangeItem.update({
      status: INVOICE_PRICE_CHANGE_ITEM_STATUSES.DELETED,
    });

    res.send({ message: 'Price change item deleted successfully' });
  }),
);
