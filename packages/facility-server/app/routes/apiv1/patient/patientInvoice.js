import { INVOICE_STATUSES } from '@tamanu/constants';
import { getInvoiceSummary } from '@tamanu/shared/utils/invoice';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { getInsurancePlanItems } from '../encounter';

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

    const dataResponse = await Promise.all(
      data.map(async invoiceRecord => {
        const { Invoice, InvoicePriceList } = models;
        // Determine the price list for the invoice based on its encounter
        const invoiceId = invoiceRecord.id;
        const encounterId = invoiceRecord.encounterId;
        const invoicePriceListId = await InvoicePriceList.getIdForPatientEncounter(encounterId);

        // Refetch the invoice with associations that depend on the price list
        const hydratedInvoiceRecord = await Invoice.findOne({
          where: { id: invoiceId },
          include: Invoice.getFullReferenceAssociations(invoicePriceListId),
        });

        const invoice = hydratedInvoiceRecord.get({ plain: true });
        const invoiceItemsResponse = invoice.items.map(
          getInsurancePlanItems(invoice.insurancePlans),
        );
        return { ...invoice, items: invoiceItemsResponse };
      }),
    );

    res.send({
      count,
      data: dataResponse,
    });
  }),
);

patientInvoiceRoutes.get(
  '/:id/invoices/totalOutstandingBalance',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Invoice');

    const { models, params } = req;
    const patientId = params.id;

    const invoices = await models.Invoice.findAll({
      where: {
        status: INVOICE_STATUSES.FINALISED,
      },
      include: [
        ...models.Invoice.getFullReferenceAssociations(),
        {
          model: models.Encounter,
          as: 'encounter',
          where: { patientId },
        },
      ],
    });

    const balance = invoices.reduce(
      (acc, invoice) => acc + getInvoiceSummary(invoice).patientPaymentRemainingBalance,
      0,
    );

    res.send({
      result: balance,
    });
  }),
);
