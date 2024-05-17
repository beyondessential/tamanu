import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import { NotFoundError } from '@tamanu/shared/errors';
import { INVOICE_LINE_ITEM_STATUSES } from '@tamanu/constants';
import {
  permissionCheckingRouter,
  simpleGet,
  simpleGetList,
  simplePut,
} from '@tamanu/shared/utils/crudHelpers';
import { renameObjectKeys } from '@tamanu/shared/utils';
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

invoiceLineItemsRoute.put(
  '/:invoiceId/lineItems',
  asyncHandler(async (req, res) => {
    const {
      models,
      params: { invoiceId },
    } = req;
    req.checkPermission('write', 'InvoiceLineItem');
    req.checkPermission('create', 'InvoiceLineItem');

    const { invoiceLineItemsData } = req.body;

    // Fetch existing line items for the given invoiceId
    const existingItems = await models.InvoiceLineItem.findAll({ where: { invoiceId } });

    // Prepare arrays for creating and updating
    const itemsToCreate = [];
    const itemsToUpdate = [];
    const receivedItemIds = invoiceLineItemsData.map(item => item.id);

    // Mark items as deleted if they are not in the received data
    await models.InvoiceLineItem.update(
      { status: INVOICE_LINE_ITEM_STATUSES.DELETED },
      {
        where: {
          invoiceId,
          id: {
            [Op.notIn]: receivedItemIds
          }
        }
      }
    );

    invoiceLineItemsData.forEach(item => {
      const existingItem = existingItems.find(existing => existing.id === item.id);
      if (existingItem) {
        // Compare the properties of the existing item with the received item
        if (
          existingItem.invoiceLineTypeId !== item.invoiceLineTypeId ||
          existingItem.dateGenerated !== item.date ||
          existingItem.orderedById !== item.orderedById
        ) {
          itemsToUpdate.push(item);
        }
      } else {
        itemsToCreate.push({
          invoiceId,
          invoiceLineTypeId: item.invoiceLineTypeId,
          dateGenerated: item.date,
          orderedById: item.orderedById
        });
      }
    });

    // Update existing items
    for (const item of itemsToUpdate) {
      await models.InvoiceLineItem.update(
        {
          invoiceLineTypeId: item.invoiceLineTypeId,
          dateGenerated: item.date,
          orderedById: item.orderedById
        },
        { where: { id: item.id } }
      );
    }

    // Create new items
    await models.InvoiceLineItem.bulkCreate(itemsToCreate);

    // Fetch all updated and created line items for the response
    const updatedLineItems = await models.InvoiceLineItem.findAll({ where: { invoiceId } });

    res.send(updatedLineItems);
  })
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
    const { models, params, db, getLocalisation, query } = req;
    const { invoiceId } = params;
    const { order, orderBy } = query;

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
    if (order && orderBy) {
      data.sort((a, b) => {
        if (a[orderBy] < b[orderBy]) {
          return order === 'asc' ? -1 : 1;
        }
        if (a[orderBy] > b[orderBy]) {
          return order === 'asc' ? 1 : -1;
        }
      });
    }
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
