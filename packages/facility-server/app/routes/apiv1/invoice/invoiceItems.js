import { permissionCheckingRouter, simpleGetList } from '@tamanu/shared/utils/crudHelpers';
import asyncHandler from 'express-async-handler';
import { getPotentialInvoiceItems } from './getPotentialInvoiceItems';
import { transform, set } from 'lodash';

export const invoiceItemsRoute = permissionCheckingRouter('read', 'Invoice');

invoiceItemsRoute.get(
  '/:id/items',
  simpleGetList('InvoiceItem', 'invoiceId', { skipPermissionCheck: true }),
);

invoiceItemsRoute.get(
  '/:id/potentialInvoiceItems',
  asyncHandler(async (req, res) => {
    const localisation = await req.getLocalisation();
    const { models, params } = req;

    // Determine price list for this invoice based on encounter context
    const { Invoice } = models;
    const invoiceId = params.id;
    const invoice = await Invoice.findByPk(invoiceId, {
      include: [
        {
          association: 'encounter',
          include: [
            {
              association: 'patient',
              include: [{ association: 'additionalData' }],
            },
            'location',
          ],
        },
      ],
    });

    if (!invoice) {
      return res.status(404).send({ message: 'Invoice not found' });
    }

    const { encounter } = invoice;
    if (!encounter) {
      return res.status(404).send({ message: 'Encounter not found for this invoice' });
    }

    const inputs = {
      patientType:
        encounter.patientBillingTypeId ||
        encounter.patient.additionalData?.[0]?.patientBillingTypeId,
      patientDOB: encounter.patient.dateOfBirth,
      facilityId: encounter.location.facilityId,
    };
    const invoicePriceListId = await models.InvoicePriceList.getIdForPatientEncounter(inputs);

    const data = await getPotentialInvoiceItems(
      req.db,
      req.params.id,
      Object.keys(localisation?.imagingTypes ?? {}),
      invoicePriceListId,
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
