import { getResourceList, permissionCheckingRouter } from '@tamanu/shared/utils/crudHelpers';
import asyncHandler from 'express-async-handler';
import { getPotentialInvoiceItems } from './getPotentialInvoiceItems';
import { transform, set } from 'lodash';

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

invoiceItemsRoute.get(
  '/:id/potentialInvoiceItems',
  asyncHandler(async (req, res) => {
    const localisation = await req.getLocalisation();
    const data = await getPotentialInvoiceItems(
      req.db,
      req.params.id,
      Object.keys(localisation?.imagingTypes ?? {}),
    );
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
