import { permissionCheckingRouter, simpleGetList } from '@tamanu/shared/utils/crudHelpers';
import asyncHandler from 'express-async-handler';
import { getPotentialInvoiceItems } from './getPotentialInvoiceItems';

export const invoiceItemsRoute = permissionCheckingRouter('read', 'Invoice');

invoiceItemsRoute.get('/:id/items', simpleGetList('InvoiceItem', 'invoiceId'));

invoiceItemsRoute.get(
  '/:id/potentialInvoiceItems',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();
    const data = await getPotentialInvoiceItems(req.db, req.params.id);
    res.json(data);
  }),
);
