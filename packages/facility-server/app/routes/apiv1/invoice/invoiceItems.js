import { getResourceList, permissionCheckingRouter } from '@tamanu/shared/utils/crudHelpers';
import asyncHandler from 'express-async-handler';
import { NotFoundError } from '@tamanu/errors';

export const invoiceItemsRoute = permissionCheckingRouter('read', 'Invoice');

invoiceItemsRoute.get(
  '/:id/items',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const invoiceId = params.id;
    const invoice = await models.Invoice.findByPk(invoiceId);

    if (!invoice) {
      throw new NotFoundError(`Invoice not found: ${invoiceId}`);
    }

    const response = await getResourceList(req, 'InvoiceItem', 'invoiceId', {
      skipPermissionCheck: true,
      include: await models.InvoiceItem.getPricingAssociations(invoice.encounterId),
    });

    res.send(response);
  }),
);
