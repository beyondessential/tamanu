import asyncHandler from 'express-async-handler';
import { NotFoundError } from 'shared/errors';
import { permissionCheckingRouter } from '../crudHelpers';

export const invoicePriceChangeItemsRoute = permissionCheckingRouter('read', 'Invoice');

invoicePriceChangeItemsRoute.get(
  '/:id/invoicePriceChangeItems',
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
  '/:id/invoicePriceChangeItems',
  asyncHandler(async (req, res) => {
    const {
      models,
      params: { id: invoiceId },
    } = req;
    req.checkPermission('write', 'InvoicePriceChangeItem');

    const invoicePriceChangeItemData = req.body;
    const invoicePriceChangeItem = await models.InvoicePriceChangeItem.create({
      ...invoicePriceChangeItemData,
      invoiceId,
    });
    res.send(invoicePriceChangeItem);
  }),
);

invoicePriceChangeItemsRoute.get(
  '/:id/invoicePriceChangeItems/:invoicePriceChangeItemId',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    req.checkPermission('read', 'InvoicePriceChangeItem');

    const invoicePriceChangeItemId = params.invoicePriceChangeItemId;
    const invoicePriceChangeItem = await models.InvoicePriceChangeItem.findByPk(
      invoicePriceChangeItemId,
    );

    req.checkPermission('read', invoicePriceChangeItem);

    res.send(invoicePriceChangeItem);
  }),
);

invoicePriceChangeItemsRoute.put(
  '/:id/invoicePriceChangeItems/:invoicePriceChangeItemId',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    req.checkPermission('write', 'InvoicePriceChangeItem');

    const invoicePriceChangeItemId = params.invoicePriceChangeItemId;
    const invoicePriceChangeItem = await models.InvoicePriceChangeItem.findByPk(
      invoicePriceChangeItemId,
    );
    if (!invoicePriceChangeItem) {
      throw new NotFoundError();
    }
    req.checkPermission('write', invoicePriceChangeItem);

    await invoicePriceChangeItem.update(req.body);

    res.send(invoicePriceChangeItem);
  }),
);

invoicePriceChangeItemsRoute.delete(
  '/:id/invoicePriceChangeItems/:invoicePriceChangeItemId',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    req.checkPermission('write', 'InvoicePriceChangeItem');

    const invoicePriceChangeItemId = params.invoicePriceChangeItemId;
    const invoicePriceChangeItem = await models.InvoicePriceChangeItem.findByPk(
      invoicePriceChangeItemId,
    );
    if (!invoicePriceChangeItem) {
      throw new NotFoundError();
    }
    req.checkPermission('write', invoicePriceChangeItem);

    await models.InvoicePriceChangeItem.destroy({
      where: {
        id: invoicePriceChangeItemId,
      },
    });

    res.send({ message: 'Item deleted successfully' });
  }),
);
