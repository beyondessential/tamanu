import { getResourceList, permissionCheckingRouter } from '@tamanu/shared/utils/crudHelpers';
import asyncHandler from 'express-async-handler';

export const invoiceItemsRoute = permissionCheckingRouter('read', 'Invoice');

invoiceItemsRoute.get(
  '/:id/items',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const invoiceId = params.id;
    const invoice = await models.Invoice.findByPk(invoiceId);

    if (!invoice) {
      throw new Error(`Invoice not found: ${invoiceId}`);
    }

    const invoicePriceListId = await models.InvoicePriceList.getIdForPatientEncounter(
      invoice.encounterId,
    );

    const associations = models.InvoiceItem.getListReferenceAssociations(
      models,
      invoicePriceListId,
    );

    const response = await getResourceList(req, 'InvoiceItem', 'invoiceId', {
      skipPermissionCheck: true,
      include: associations,
    });

    res.send(response);
  }),
);
