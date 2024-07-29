import express from 'express';
import asyncHandler from 'express-async-handler';

export const patientInvoiceRoutes = express.Router();

const encounterOrderByKeys = ['encounterType'];
const invoiceOrderByKeys = ['date', 'displayId', 'status'];

patientInvoiceRoutes.get(
  '/:id/invoices',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Invoice');

    const { models, params, query } = req;
    const { order = 'ASC', orderBy, rowsPerPage = 10, page = 0 } = query;
    const patientId = params.id;

    const data = await models.Invoice.findAll({
      include: [
        ...models.Invoice.getFullReferenceAssociations(),
        {
          model: models.Encounter,
          as: 'encounter',
          where: { patientId },
          order:
            orderBy && encounterOrderByKeys.includes(orderBy)
              ? [[orderBy, order.toUpperCase()]]
              : undefined,
        },
      ],
      order:
        orderBy && invoiceOrderByKeys.includes(orderBy)
          ? [[orderBy, order.toUpperCase()]]
          : undefined,
      limit: rowsPerPage,
      offset: page * rowsPerPage,
    });

    const count = await models.Invoice.count({
      include: [
        {
          model: models.Encounter,
          as: 'encounter',
          where: { patientId },
        },
      ],
    });

    res.send({
      count,
      data,
    });
  }),
);
