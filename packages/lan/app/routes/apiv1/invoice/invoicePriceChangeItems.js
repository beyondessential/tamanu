import asyncHandler from 'express-async-handler';
import { NotFoundError } from 'shared/errors';
import { permissionCheckingRouter } from '../crudHelpers';

export const invoicePriceChangeItemsRoute = permissionCheckingRouter('read', 'Invoice');

invoicePriceChangeItemsRoute.get(
  '/:id/priceChangeItems',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    req.checkPermission('list', 'InvoicePriceChangeItem');

    const invoiceId = params.id;
    const invoicePriceChangeItems = await models.InvoicePriceChangeItem.findAll({
      include: [
        {
          model: models.InvoicePriceChangeType,
          as: 'invoicePriceChangeType',
          include: models.InvoicePriceChangeType.getFullLinkedItemsInclude(models),
        },
        {
          model: models.User,
          as: 'orderedBy',
        },
      ],
      where: { invoiceId },
    });

    res.send({
      count: invoicePriceChangeItems.length,
      data: invoicePriceChangeItems,
    });
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

    const priceChangeItemId = { params };
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

    await models.InvoicePriceChangeItem.destroy({
      where: {
        id: priceChangeItemId,
      },
    });

    res.send({ message: 'Item deleted successfully' });
  }),
);
