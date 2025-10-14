import { permissionCheckingRouter } from '@tamanu/shared/utils/crudHelpers';
import asyncHandler from 'express-async-handler';
import { getPotentialInvoiceItems } from './getPotentialInvoiceItems';
import { transform, set } from 'lodash';

export const invoiceItemsRoute = permissionCheckingRouter('read', 'Invoice');

// {
//     patientType: 'patientType-Charity',
//     patientDOB: '2000-08-08',
//    facilityId: 'facility-1'
// }
async function getPriceListId(models, inputs) {
  if (models?.PriceList?.getIdForInputs) {
    return await models.PriceList.getIdForInputs(inputs);
  }
  return null;
}

invoiceItemsRoute.get(
  '/:id/items',
  asyncHandler(async (req, res) => {
    const { models, params, query } = req;
    const { order = 'ASC', orderBy = 'createdAt', rowsPerPage, page } = query;
    const { InvoiceItem, Invoice } = models;

    const invoiceId = params.id;
    const { encounter } = await Invoice.findByPk(invoiceId, {
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

    const inputs = {
      patientType:
        encounter.patientBillingTypeId ||
        encounter.patient.additionalData?.[0]?.patientBillingTypeId,
      patientDOB: encounter.patient.dateOfBirth,
      facilityId: encounter.location.facilityId,
    };

    console.log(
      'encounter.patient.additionalData.patientBillingTypeId test',
      encounter.patient.additionalData?.[0]?.patientBillingTypeId,
    );
    console.log('inputs', inputs);
    const priceListId = await getPriceListId(models, inputs);
    const associations = [
      {
        model: models.InvoiceProduct,
        as: 'product',
        include: [
          {
            model: models.PriceListItem,
            ...(priceListId ? { where: { priceListId } } : {}),
            as: 'priceListItem',
            attributes: ['price'],
            required: false,
          },
          {
            model: models.ReferenceData,
            as: 'referenceData',
            attributes: ['code', 'type'],
          },
          {
            model: models.LabTestType,
            as: 'labTestType',
            attributes: ['code'],
          },
        ],
      },
      {
        model: models.User,
        as: 'orderedByUser',
        attributes: ['displayName'],
      },
      {
        model: models.InvoiceItemDiscount,
        as: 'discount',
      },
    ];

    const baseQueryOptions = {
      where: {
        invoiceId,
      },
      order: orderBy ? [[...orderBy.split('.'), order.toUpperCase()]] : undefined,
      include: associations,
    };

    const count = await InvoiceItem.count({
      ...baseQueryOptions,
      distinct: true,
    });

    const objects = await InvoiceItem.findAll({
      ...baseQueryOptions,
      limit: rowsPerPage,
      offset: page && rowsPerPage ? page * rowsPerPage : undefined,
    });

    const data = objects.map(x => x.forResponse());

    res.send({ count, data });
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
