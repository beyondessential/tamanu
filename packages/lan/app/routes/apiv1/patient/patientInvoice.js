import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';

import { mapQueryFilters, getCaseInsensitiveFilter } from '../../../database/utils';

export const patientInvoiceRoutes = express.Router();

const COLUMNS_MAP = {
  invoiceDisplayId: 'display_id',
  receiptNumber: 'receipt_number',
  status: 'status',
  paymentStatus: 'payment_status',
};

const caseInsensitiveFilter = getCaseInsensitiveFilter(COLUMNS_MAP);
const encounterOrderByKeys = ['encounterType'];
const invoiceOrderByKeys = ['date', 'displayId', 'receiptNumber', 'total', 'status'];

patientInvoiceRoutes.get(
  '/:id/invoices',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Invoice');

    const { models, params, query } = req;
    const { order = 'ASC', orderBy, rowsPerPage = 10, page = 0, ...filterParams } = query;
    const patientId = params.id;
    // Model filters for Sequelize 'where' clauses
    const invoiceFilters = mapQueryFilters(filterParams, [
      {
        key: 'invoiceDisplayId',
        operator: Op.startsWith,
        mapFn: caseInsensitiveFilter,
      },
      {
        key: 'receiptNumber',
        operator: Op.startsWith,
        mapFn: caseInsensitiveFilter,
      },
      {
        key: 'status',
        operator: Op.eq,
        mapFn: caseInsensitiveFilter,
      },
      {
        key: 'paymentStatus',
        operator: Op.eq,
        mapFn: caseInsensitiveFilter,
      },
    ]);

    const invoices = await models.Invoice.findAll({
      include: [
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
      where: invoiceFilters,
      order:
        orderBy && invoiceOrderByKeys.includes(orderBy)
          ? [[orderBy, order.toUpperCase()]]
          : undefined,
      limit: rowsPerPage,
      offset: page * rowsPerPage,
    });

    res.send({
      count: invoices.length,
      data: invoices,
    });
  }),
);
