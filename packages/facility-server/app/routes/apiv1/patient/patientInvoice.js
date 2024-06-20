import express from 'express';
import asyncHandler from 'express-async-handler';

export const patientInvoiceRoutes = express.Router();

const encounterOrderByKeys = ['encounterType'];
const invoiceOrderByKeys = ['date', 'displayId', 'paymentStatus', 'status'];

patientInvoiceRoutes.get(
  '/:id/invoices',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Invoice');

    const { models, params, query } = req;
    const { order = 'ASC', orderBy, rowsPerPage = 10, page = 0 } = query;
    const patientId = params.id;

    const { rows, count } = await models.Invoice.findAndCountAll({
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

    res.send({
      count,
      data: rows,
    });
  }),
);
