import { permissionCheckingRouter, simpleGetList } from '@tamanu/shared/utils/crudHelpers';
import asyncHandler from 'express-async-handler';
import { renameObjectKeys } from '@tamanu/shared/utils';
import { transform, set } from 'lodash';
import { getPotentialInvoiceItems } from './getPotentialInvoiceItems';

export const invoiceItemsRoute = permissionCheckingRouter('read', 'Invoice');

invoiceItemsRoute.get('/:id/items', simpleGetList('InvoiceItem', 'invoiceId'));

invoiceItemsRoute.get(
  '/:invoiceId/potentialInvoiceItems',
  asyncHandler(async (req, res) => {
    const { models, params, db, getLocalisation, query } = req;
    const { invoiceId } = params;
    const order = query.order?.toLowerCase();
    const orderBy = query.orderBy;

    const invoice = await models.Invoice.findByPk(invoiceId);
    const { encounterId } = invoice;
    const localisation = await getLocalisation();
    const { imagingTypes } = localisation;

    const potentialInvoiceLineItems = await getPotentialInvoiceItems(
      db,
      models,
      encounterId,
      imagingTypes,
    );
    const data = potentialInvoiceLineItems.map(x => renameObjectKeys(x.forResponse()));

    const transformedData = data.map(it =>
      transform(
        it,
        (result, value, key) => {
          set(result, key, value);
        },
        {},
      ),
    );

    if (order && orderBy) {
      transformedData.sort((a, b) => {
        const valA = a[orderBy];
        const valB = b[orderBy];
        if (orderBy === 'code' || orderBy === 'type') {
          if (order === 'asc') {
            return valA?.localeCompare(valB);
          } else {
            return valB?.localeCompare(valA);
          }
        } else if (orderBy === 'price') {
          return order === 'asc' ? valA - valB : valB - valA;
        } else if (orderBy === 'orderDate') {
          return order === 'asc' ? Date.parse(valA) - Date.parse(valB) : Date.parse(valB) - Date.parse(valA);
        }
        return 0;
      });
    }

    res.send({
      count: transformedData.length,
      data: transformedData,
    });
  }),
);
