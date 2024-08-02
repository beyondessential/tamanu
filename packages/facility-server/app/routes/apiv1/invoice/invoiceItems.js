import { permissionCheckingRouter, simpleGetList } from '@tamanu/shared/utils/crudHelpers';
import asyncHandler from 'express-async-handler';
import { getPotentialInvoiceItems } from './getPotentialInvoiceItems';
import { IMAGING_TYPES_VALUES } from '@tamanu/constants';
import { transform, set } from 'lodash';

export const invoiceItemsRoute = permissionCheckingRouter('read', 'Invoice');

invoiceItemsRoute.get('/:id/items', simpleGetList('InvoiceItem', 'invoiceId', { skipPermissionCheck: true }));

invoiceItemsRoute.get(
  '/:id/potentialInvoiceItems',
  asyncHandler(async (req, res) => {
    const data = await getPotentialInvoiceItems(req.db, req.params.id, IMAGING_TYPES_VALUES);
    const transformedData = data.map(it =>
      transform(
        it,
        (result, value, key) => {
          set(result, key, value);
        },
        {},
      ),
    );
    res.json({ count: transformedData.length, data: transformedData });
  }),
);
