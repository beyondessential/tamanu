import { permissionCheckingRouter, simpleGetList } from '@tamanu/shared/utils/crudHelpers';
import asyncHandler from 'express-async-handler';
import { getPotentialInvoiceItems } from './getPotentialInvoiceItems';
import { IMAGING_TYPES_VALUES } from '@tamanu/constants';
export const invoiceItemsRoute = permissionCheckingRouter('read', 'Invoice');

invoiceItemsRoute.get('/:id/items', simpleGetList('InvoiceItem', 'invoiceId'));

invoiceItemsRoute.get(
  '/:id/potentialInvoiceItems',
  asyncHandler(async (req, res) => {
    const data = await getPotentialInvoiceItems(req.db, req.params.id, IMAGING_TYPES_VALUES);
    res.json(data);
  }),
);
